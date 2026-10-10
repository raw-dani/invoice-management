<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Http\Requests\StoreQuoteRequest;
use App\Http\Requests\UpdateQuoteRequest;
use App\Http\Resources\InvoiceResource;
use App\Http\Resources\QuoteResource;
use App\Models\Invoice;
use App\Models\Quote;
use App\Models\QuoteMilestone;
use App\Services\PdfService;
use App\Services\QuoteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class QuoteController extends Controller
{
    private function authorizeCompany(Quote $quote): void
    {
        if ($quote->company_id !== auth()->user()->company_id) {
            abort(403, 'Unauthorized action.');
        }
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Quote::with('customer')
            ->where('company_id', auth()->user()->company_id);

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where('quote_number', 'like', "%{$search}%");
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->integer('customer_id'));
        }

        $perPage = min((int) $request->input('per_page', 15), 100);

        $quotes = $query->latest()->paginate($perPage);

        return QuoteResource::collection($quotes);
    }

    public function store(StoreQuoteRequest $request): JsonResponse
    {
        $this->authorize('create', Quote::class);

        $data = $request->validated();

        $quote = DB::transaction(function () use ($data) {
            $quote = Quote::create([
                'company_id'    => auth()->user()->company_id,
                'customer_id'   => $data['customer_id'],
                'quote_number'  => Quote::generateQuoteNumber(auth()->user()->company_id),
                'quote_date'    => $data['quote_date'],
                'valid_until'   => $data['valid_until'] ?? null,
                'currency'      => $data['currency'],
                'discount'      => $data['discount'] ?? 0,
                'discount_type' => $data['discount_type'],
                'tax_rate'      => $data['tax_rate'] ?? 0,
                'notes'         => $data['notes'] ?? null,
                'terms'         => $data['terms'] ?? null,
                'status'        => 'draft',
            ]);

            foreach ($data['items'] as $item) {
                $quote->items()->create($item);
            }

            $quote->load('items');
            $quote->calculateTotals();

            return $quote;
        });

        return (new QuoteResource($quote->load('customer', 'items.product')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Quote $quote): QuoteResource
    {
        $this->authorize('view', $quote);

        return new QuoteResource(
            $quote->load('customer', 'items.product', 'milestones.invoice')
        );
    }

    public function update(UpdateQuoteRequest $request, Quote $quote): QuoteResource
    {
        $this->authorize('manage', $quote);

        if (!in_array($quote->status, ['draft', 'sent', 'viewed', 'rejected', 'expired'], true)) {
            abort(422, 'Only quotes in draft, sent, viewed, rejected, or expired status can be edited.');
        }

        $data = $request->validated();

        DB::transaction(function () use ($quote, $data) {
            $quote->update(collect($data)->except('items')->toArray());
            $quote->items()->delete();
            foreach ($data['items'] as $item) {
                $quote->items()->create($item);
            }

            $quote->refresh()->load('items');
            $quote->calculateTotals();
        });

        return new QuoteResource($quote->load('customer', 'items.product'));
    }

    public function destroy(Quote $quote): JsonResponse
    {
        $this->authorize('delete', $quote);

        if (!in_array($quote->status, ['draft', 'rejected', 'expired'], true)) {
            abort(422, 'Only drafts, rejected, or expired quotes can be deleted.');
        }

        $quote->delete();
        ActivityLog::record('quote.deleted', "Quote {$quote->quote_number} deleted", $quote);

        return response()->json(['message' => 'Quote deleted successfully.']);
    }

    public function send(Quote $quote): QuoteResource
    {
        $this->authorize('manage', $quote);

        if ($quote->status !== 'draft') {
            abort(422, 'Only draft quotes can be sent.');
        }

        $quote->update(['status' => 'sent']);
        ActivityLog::record('quote.sent', "Quote {$quote->quote_number} sent", $quote);

        return new QuoteResource($quote->fresh()->load('customer', 'items.product'));
    }

    public function accept(Quote $quote): QuoteResource
    {
        $this->authorize('manage', $quote);

        if (!in_array($quote->status, ['sent', 'viewed'], true)) {
            abort(422, 'Only sent or viewed quotes can be accepted.');
        }

        $quote->update(['status' => 'accepted']);
        ActivityLog::record('quote.accepted', "Quote {$quote->quote_number} accepted", $quote);

        return new QuoteResource($quote->fresh()->load('customer', 'items.product'));
    }

    public function reject(Quote $quote): QuoteResource
    {
        $this->authorize('manage', $quote);

        if (!in_array($quote->status, ['sent', 'viewed', 'accepted'], true)) {
            abort(422, 'Only sent, viewed, or accepted quotes can be rejected.');
        }

        $quote->update(['status' => 'rejected']);
        ActivityLog::record('quote.rejected', "Quote {$quote->quote_number} rejected", $quote);

        return new QuoteResource($quote->fresh()->load('customer', 'items.product'));
    }

    public function duplicate(Quote $quote): JsonResponse
    {
        $this->authorize('manage', $quote);
        $quote->load('items');

        $duplicate = \Illuminate\Support\Facades\DB::transaction(function () use ($quote): Quote {
            $copy = $quote->replicate(['quote_number', 'status', 'public_token']);
            $copy->quote_number = Quote::generateQuoteNumber($quote->company_id);
            $copy->quote_date = now()->toDateString();
            $copy->valid_until = now()->addDays((int) (\App\Models\Setting::getValue($quote->company_id, 'valid_days', '30') ?: 30))->toDateString();
            $copy->status = 'draft';
            $copy->save();
            foreach ($quote->items as $item) {
                $copy->items()->create($item->only(['product_id', 'description', 'quantity', 'unit_price', 'discount', 'tax_rate']));
            }
            $copy->load('items');
            $copy->calculateTotals();
            ActivityLog::record('quote.duplicated', "Quote {$quote->quote_number} duplicated", $copy, ['source_quote_id' => $quote->id]);
            return $copy->load('customer', 'items.product');
        });

        return response()->json(['data' => new QuoteResource($duplicate)], 201);
    }

    public function markAsExpired(Quote $quote): QuoteResource
    {
        $this->authorize('manage', $quote);

        if (!in_array($quote->status, ['sent', 'viewed'], true)) {
            abort(422, 'Only sent or viewed quotes can be expired.');
        }

        $quote->update(['status' => 'expired']);
        ActivityLog::record('quote.expired', "Quote {$quote->quote_number} expired", $quote);

        return new QuoteResource($quote->fresh()->load('customer', 'items.product'));
    }

    public function convertToInvoice(Quote $quote, QuoteService $quoteService): InvoiceResource
    {
        $this->authorize('manage', $quote);

        if ($quote->status !== 'accepted') {
            abort(422, 'Only accepted quotes can be converted to invoice.');
        }

        $invoice = $quoteService->convertToInvoice($quote);
        ActivityLog::record('quote.converted', "Quote {$quote->quote_number} converted to invoice", $quote, [
            'invoice_id' => $invoice->id,
        ]);

        return new InvoiceResource($invoice->load('customer', 'items.product'));
    }

    public function pdf(Quote $quote, PdfService $pdf): Response
    {
        $this->authorize('view', $quote);
        $quote->load('customer', 'items.product');

        $pdfContent = $pdf->renderQuote($quote, request()->query('template'));
        $filename = "quote-{$quote->quote_number}.pdf";

        return response()->make($pdfContent, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => "inline; filename=\"{$filename}\"",
        ]);
    }

    public function bulkAction(\Illuminate\Http\Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer',
            'action' => 'required|in:mark_as_expired',
        ]);

        $quotes = Quote::where('company_id', auth()->user()->company_id)->whereIn('id', $data['ids'])->get();

        $processed = 0;
        $failed = 0;
        foreach ($quotes as $quote) {
            if (!in_array($quote->status, ['sent', 'viewed'], true)) {
                $failed++;
                continue;
            }

            $quote->update(['status' => 'expired']);
            ActivityLog::record('quote.expired', "Quote {$quote->quote_number} expired", $quote, [
                'previous_status' => $quote->getOriginal('status'),
            ]);
            $processed++;
        }

        return response()->json(['data' => ['processed' => $processed, 'failed' => $failed]]);
    }

    public function saveMilestones(Request $request, Quote $quote): JsonResponse
    {
        $this->authorize('manage', $quote);

        $data = $request->validate([
            'milestones' => ['required', 'array', 'min:1'],
            'milestones.*.name' => ['required', 'string', 'max:255'],
            'milestones.*.percentage' => ['required', 'numeric', 'min:0.01', 'max:100'],
            'milestones.*.due_date' => ['nullable', 'date'],
            'milestones.*.notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $totalPercentage = collect($data['milestones'])->sum('percentage');
        if (abs($totalPercentage - 100) > 0.05) {
            abort(422, 'Total persentase termin harus tepat 100% (saat ini: ' . round($totalPercentage, 2) . '%).');
        }

        // Delete existing milestones that don't have an invoice yet
        $quote->milestones()->whereNull('invoice_id')->delete();

        $seq = 1;
        foreach ($data['milestones'] as $m) {
            $amount = round($quote->total * ($m['percentage'] / 100), 2);
            $quote->milestones()->create([
                'company_id' => $quote->company_id,
                'sequence' => $seq++,
                'name' => $m['name'],
                'percentage' => $m['percentage'],
                'amount' => $amount,
                'due_date' => $m['due_date'] ?? null,
                'notes' => $m['notes'] ?? null,
                'status' => 'pending',
            ]);
        }

        ActivityLog::record('quote.milestones_updated', "Rencana termin untuk penawaran {$quote->quote_number} berhasil diperbarui", $quote);

        return response()->json([
            'message' => 'Rencana termin pembayaran berhasil disimpan.',
            'data' => new QuoteResource($quote->fresh(['customer', 'items.product', 'milestones.invoice'])),
        ]);
    }

    public function generateMilestoneInvoice(Quote $quote, \App\Models\QuoteMilestone $milestone): JsonResponse
    {
        $this->authorize('manage', $quote);

        if ($milestone->quote_id !== $quote->id) {
            abort(404, 'Milestone tidak ditemukan pada penawaran ini.');
        }

        if ($milestone->invoice_id) {
            abort(422, 'Invoice untuk termin ini sudah pernah diterbitkan sebelumnya.');
        }

        $dueDays = (int) (\App\Models\Setting::getValue($quote->company_id, 'due_days', 14) ?: 14);
        $totalTermins = $quote->milestones()->count();

        $invoice = DB::transaction(function () use ($quote, $milestone, $dueDays, $totalTermins) {
            $inv = Invoice::create([
                'company_id' => $quote->company_id,
                'customer_id' => $quote->customer_id,
                'quote_id' => $quote->id,
                'milestone_name' => $milestone->name,
                'milestone_sequence' => $milestone->sequence,
                'milestone_total_termins' => $totalTermins,
                'milestone_percentage' => $milestone->percentage,
                'invoice_number' => Invoice::generateInvoiceNumber($quote->company_id),
                'invoice_date' => now()->toDateString(),
                'due_date' => $milestone->due_date ?: now()->addDays($dueDays)->toDateString(),
                'status' => 'draft',
                'currency' => $quote->currency,
                'discount' => 0,
                'discount_type' => 0,
                'tax_rate' => 0,
                'tax_amount' => 0,
                'subtotal' => $milestone->amount,
                'total' => $milestone->amount,
                'balance' => $milestone->amount,
                'paid_amount' => 0,
                'notes' => "Tagihan {$milestone->name} ({$milestone->percentage}%) dari Penawaran #{$quote->quote_number}." . ($milestone->notes ? "\n" . $milestone->notes : ''),
                'terms' => $quote->terms,
            ]);

            $mainDescription = $quote->items->first()?->description ?: "Pengerjaan Proyek Penawaran #{$quote->quote_number}";
            $inv->items()->create([
                'description' => "{$milestone->name} ({$milestone->percentage}%): {$mainDescription}",
                'quantity' => 1,
                'unit_price' => $milestone->amount,
                'discount' => 0,
                'tax_rate' => 0,
                'tax_amount' => 0,
                'total' => $milestone->amount,
            ]);

            $milestone->update([
                'invoice_id' => $inv->id,
                'status' => 'invoiced',
            ]);

            // If all milestones now have invoices, mark quote converted
            $unbilledCount = $quote->milestones()->whereNull('invoice_id')->count();
            if ($unbilledCount === 0) {
                $quote->update(['status' => 'converted']);
            }

            return $inv;
        });

        ActivityLog::record('quote.milestone_invoiced', "Invoice {$invoice->invoice_number} berhasil diterbitkan untuk {$milestone->name}", $quote);

        return response()->json([
            'message' => "Invoice {$invoice->invoice_number} untuk {$milestone->name} berhasil dibuat.",
            'data' => new InvoiceResource($invoice->load('customer', 'items')),
        ], 201);
    }
}
