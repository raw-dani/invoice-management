<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Http\Requests\StoreQuoteRequest;
use App\Http\Requests\UpdateQuoteRequest;
use App\Http\Resources\InvoiceResource;
use App\Http\Resources\QuoteResource;
use App\Models\Quote;
use App\Services\PdfService;
use App\Services\QuoteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
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
        $data = $request->validated();

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

        return (new QuoteResource($quote->load('customer', 'items.product')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Quote $quote): QuoteResource
    {
        $this->authorizeCompany($quote);

        return new QuoteResource(
            $quote->load('customer', 'items.product')
        );
    }

    public function update(UpdateQuoteRequest $request, Quote $quote): QuoteResource
    {
        $this->authorizeCompany($quote);

        if (!in_array($quote->status, ['draft', 'sent', 'viewed', 'rejected', 'expired'], true)) {
            abort(422, 'Only quotes in draft, sent, viewed, rejected, or expired status can be edited.');
        }

        $data = $request->validated();

        $quote->update(collect($data)->except('items')->toArray());
        $quote->items()->delete();
        foreach ($data['items'] as $item) {
            $quote->items()->create($item);
        }

        $quote->refresh()->load('items');
        $quote->calculateTotals();

        return new QuoteResource($quote->load('customer', 'items.product'));
    }

    public function destroy(Quote $quote): JsonResponse
    {
        $this->authorizeCompany($quote);

        if (!in_array($quote->status, ['draft', 'rejected', 'expired'], true)) {
            abort(422, 'Only drafts, rejected, or expired quotes can be deleted.');
        }

        $quote->delete();
        ActivityLog::record('quote.deleted', "Quote {$quote->quote_number} deleted", $quote);

        return response()->json(['message' => 'Quote deleted successfully.']);
    }

    public function send(Quote $quote): QuoteResource
    {
        $this->authorizeCompany($quote);

        if ($quote->status !== 'draft') {
            abort(422, 'Only draft quotes can be sent.');
        }

        $quote->update(['status' => 'sent']);
        ActivityLog::record('quote.sent', "Quote {$quote->quote_number} sent", $quote);

        return new QuoteResource($quote->fresh()->load('customer', 'items.product'));
    }

    public function accept(Quote $quote): QuoteResource
    {
        $this->authorizeCompany($quote);

        if (!in_array($quote->status, ['sent', 'viewed'], true)) {
            abort(422, 'Only sent or viewed quotes can be accepted.');
        }

        $quote->update(['status' => 'accepted']);
        ActivityLog::record('quote.accepted', "Quote {$quote->quote_number} accepted", $quote);

        return new QuoteResource($quote->fresh()->load('customer', 'items.product'));
    }

    public function reject(Quote $quote): QuoteResource
    {
        $this->authorizeCompany($quote);

        if (!in_array($quote->status, ['sent', 'viewed', 'accepted'], true)) {
            abort(422, 'Only sent, viewed, or accepted quotes can be rejected.');
        }

        $quote->update(['status' => 'rejected']);
        ActivityLog::record('quote.rejected', "Quote {$quote->quote_number} rejected", $quote);

        return new QuoteResource($quote->fresh()->load('customer', 'items.product'));
    }

    public function duplicate(Quote $quote): JsonResponse
    {
        $this->authorizeCompany($quote);
        $quote->load('items');

        $duplicate = \Illuminate\Support\Facades\DB::transaction(function () use ($quote): Quote {
            $copy = $quote->replicate(['quote_number', 'status']);
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
        $this->authorizeCompany($quote);

        if (!in_array($quote->status, ['sent', 'viewed'], true)) {
            abort(422, 'Only sent or viewed quotes can be expired.');
        }

        $quote->update(['status' => 'expired']);
        ActivityLog::record('quote.expired', "Quote {$quote->quote_number} expired", $quote);

        return new QuoteResource($quote->fresh()->load('customer', 'items.product'));
    }

    public function convertToInvoice(Quote $quote, QuoteService $quoteService): InvoiceResource
    {
        $this->authorizeCompany($quote);

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
        $this->authorizeCompany($quote);
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
}
