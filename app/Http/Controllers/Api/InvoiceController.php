<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Http\Requests\StoreInvoiceRequest;
use App\Http\Requests\UpdateInvoiceRequest;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Services\PdfService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class InvoiceController extends Controller
{
    private function authorizeCompany(Invoice $invoice): void
    {
        if ($invoice->company_id !== auth()->user()->company_id) {
            abort(403, 'Unauthorized action.');
        }
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Invoice::with('customer')
            ->where('company_id', auth()->user()->company_id);

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where('invoice_number', 'like', "%{$search}%");
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->integer('customer_id'));
        }

        $perPage = min((int) $request->input('per_page', 15), 100);

        $invoices = $query->latest()->paginate($perPage);

        return InvoiceResource::collection($invoices);
    }

    public function store(StoreInvoiceRequest $request): JsonResponse
    {
        $this->authorize('create', Invoice::class);

        $data = $request->validated();

        $invoice = DB::transaction(function () use ($data) {
            $invoice = Invoice::create([
                'company_id'      => auth()->user()->company_id,
                'customer_id'     => $data['customer_id'],
                'quote_id'        => $data['quote_id'] ?? null,
                'milestone_name'  => $data['milestone_name'] ?? null,
                'milestone_sequence' => $data['milestone_sequence'] ?? null,
                'milestone_total_termins' => $data['milestone_total_termins'] ?? null,
                'milestone_percentage' => $data['milestone_percentage'] ?? null,
                'invoice_number'  => Invoice::generateInvoiceNumber(auth()->user()->company_id),
                'invoice_date'    => $data['invoice_date'],
                'due_date'        => $data['due_date'],
                'currency'        => $data['currency'],
                'discount'        => $data['discount'] ?? 0,
                'discount_type'   => $data['discount_type'],
                'tax_rate'        => $data['tax_rate'] ?? 0,
                'notes'           => $data['notes'] ?? null,
                'terms'           => $data['terms'] ?? null,
                'status'          => 'draft',
            ]);

            foreach ($data['items'] as $item) {
                $invoice->items()->create($item);
            }

            $invoice->load('items');
            $invoice->calculateTotals();

            return $invoice;
        });

        return (new InvoiceResource($invoice->load('customer', 'items.product')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Invoice $invoice): InvoiceResource
    {
        $this->authorize('view', $invoice);

        return new InvoiceResource(
            $invoice->load('customer', 'items.product', 'payments')
        );
    }

    public function update(UpdateInvoiceRequest $request, Invoice $invoice): InvoiceResource
    {
        $this->authorize('manage', $invoice);

        if ($invoice->status !== 'draft') {
            abort(422, 'Only draft invoices can be edited.');
        }

        $data = $request->validated();

        DB::transaction(function () use ($invoice, $data) {
            $invoice->update(collect($data)->except('items')->toArray());
            $invoice->items()->delete();
            foreach ($data['items'] as $item) {
                $invoice->items()->create($item);
            }

            $invoice->refresh()->load('items');
            $invoice->calculateTotals();
        });

        return new InvoiceResource($invoice->load('customer', 'items.product'));
    }

    public function destroy(Invoice $invoice): JsonResponse
    {
        $this->authorize('delete', $invoice);

        if (!in_array($invoice->status, ['draft', 'cancelled'], true)) {
            abort(422, 'Only draft or cancelled invoices can be deleted.');
        }

        $invoice->delete();
        ActivityLog::record('invoice.deleted', "Invoice {$invoice->invoice_number} deleted", $invoice);

        return response()->json(['message' => 'Invoice deleted successfully.']);
    }

    public function duplicate(Invoice $invoice): JsonResponse
    {
        $this->authorize('manage', $invoice);
        $invoice->load('items');

        $duplicate = \Illuminate\Support\Facades\DB::transaction(function () use ($invoice): Invoice {
            $copy = $invoice->replicate([
                'invoice_number',
                'status',
                'paid_amount',
                'balance',
                'public_token',
                'proof_of_payment_path',
                'payment_proof_status',
                'payment_proof_uploaded_at',
                'payment_proof_rejected_reason',
            ]);
            $copy->invoice_number = Invoice::generateInvoiceNumber($invoice->company_id);
            $copy->invoice_date = now()->toDateString();
            $copy->due_date = now()->addDays(30)->toDateString();
            $copy->status = 'draft';
            $copy->paid_amount = 0;
            $copy->balance = 0;
            $copy->save();
            foreach ($invoice->items as $item) $copy->items()->create($item->only(['product_id', 'description', 'quantity', 'unit_price', 'discount', 'tax_rate']));
            $copy->load('items');
            $copy->calculateTotals();
            ActivityLog::record('invoice.duplicated', "Invoice {$invoice->invoice_number} duplicated", $copy, ['source_invoice_id' => $invoice->id]);
            return $copy->load('customer', 'items.product');
        });

        return response()->json(['data' => new InvoiceResource($duplicate)], 201);
    }

    public function markAsSent(Invoice $invoice): InvoiceResource
    {
        $this->authorize('manage', $invoice);

        if ($invoice->status !== 'draft') {
            abort(422, 'Only draft invoices can be marked as sent.');
        }

        $invoice->update(['status' => 'sent']);
        ActivityLog::record('invoice.sent', "Invoice {$invoice->invoice_number} marked as sent", $invoice);

        return new InvoiceResource($invoice->fresh()->load('customer', 'items.product'));
    }

    public function void(Invoice $invoice): InvoiceResource
    {
        $this->authorize('manage', $invoice);

        if (in_array($invoice->status, ['paid', 'void'], true)) {
            abort(422, 'Paid or void invoices cannot be voided.');
        }

        $invoice->update(['status' => 'void']);
        ActivityLog::record('invoice.voided', "Invoice {$invoice->invoice_number} voided", $invoice);

        return new InvoiceResource($invoice->fresh()->load('customer', 'items.product'));
    }

    public function pdf(Invoice $invoice, PdfService $pdf): Response
    {
        $this->authorize('view', $invoice);
        $invoice->load('customer', 'items.product');

        $pdfContent = $pdf->renderInvoice($invoice, request()->query('template'));
        $filename = "invoice-{$invoice->invoice_number}.pdf";

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
            'action' => 'required|in:mark_as_sent,void',
        ]);

        $invoices = Invoice::where('company_id', auth()->user()->company_id)->whereIn('id', $data['ids'])->get();

        $allowed = [
            'mark_as_sent' => ['draft'],
            'void' => ['draft', 'sent', 'partially_paid', 'overdue'],
        ];

        $processed = 0;
        $failed = 0;
        foreach ($invoices as $invoice) {
            if (!in_array($invoice->status, $allowed[$data['action']], true)) {
                $failed++;
                continue;
            }

            $invoice->update(['status' => $data['action'] === 'void' ? 'void' : 'sent']);
            ActivityLog::record(
                $data['action'] === 'void' ? 'invoice.voided' : 'invoice.sent',
                "Invoice {$invoice->invoice_number} bulk action: {$data['action']}",
                $invoice,
                ['previous_status' => $invoice->getOriginal('status')]
            );
            $processed++;
        }

        return response()->json(['data' => ['processed' => $processed, 'failed' => $failed]]);
    }

    public function approvePaymentProof(Request $request, Invoice $invoice): JsonResponse
    {
        $this->authorizeCompany($invoice);

        if ($invoice->payment_proof_status !== 'pending') {
            return response()->json(['message' => 'Tidak ada bukti pembayaran tertunda untuk diverifikasi.'], 422);
        }

        $amount = (float) $request->input('amount', $invoice->balance);
        if ($amount <= 0 || $amount > (float) $invoice->balance) {
            $amount = (float) $invoice->balance;
        }

        $payment = DB::transaction(function () use ($invoice, $amount, $request) {
            $payment = \App\Models\Payment::create([
                'company_id'     => $invoice->company_id,
                'customer_id'    => $invoice->customer_id,
                'invoice_id'     => $invoice->id,
                'payment_number' => \App\Models\Payment::generatePaymentNumber($invoice->company_id),
                'payment_date'   => now()->toDateString(),
                'amount'         => $amount,
                'currency'       => $invoice->currency,
                'payment_method' => $request->input('payment_method', 'bank_transfer'),
                'reference'      => 'Bukti Transfer: ' . $invoice->invoice_number,
                'notes'          => $request->input('admin_notes', 'Diverifikasi dari unggahan bukti transfer klien: ' . ($invoice->payment_proof_notes ?? '')),
            ]);

            $transitioned = $invoice->applyPayment($amount);

            $invoice->update([
                'payment_proof_status' => 'approved',
            ]);

            if ($transitioned) {
                \App\Events\InvoicePaid::dispatch($invoice->fresh());
            }

            ActivityLog::record(
                'payment_proof.approved',
                "Bukti pembayaran untuk invoice {$invoice->invoice_number} disetujui, pembayaran {$payment->payment_number} dibuat",
                $invoice,
                ['amount' => $amount, 'payment_id' => $payment->id]
            );

            return $payment;
        });

        return response()->json([
            'message' => 'Bukti pembayaran disetujui dan pembayaran berhasil dicatat.',
            'invoice' => new InvoiceResource($invoice->fresh()->load(['customer', 'items', 'payments'])),
            'payment' => $payment,
        ]);
    }

    public function rejectPaymentProof(Request $request, Invoice $invoice): JsonResponse
    {
        $this->authorizeCompany($invoice);

        $reason = $request->input('reason', 'Bukti pembayaran tidak sesuai atau tidak valid.');

        $invoice->update([
            'payment_proof_status' => 'rejected',
            'payment_proof_notes'  => ($invoice->payment_proof_notes ? $invoice->payment_proof_notes . " | " : "") . "Ditolak: " . $reason,
        ]);

        ActivityLog::record(
            'payment_proof.rejected',
            "Bukti pembayaran untuk invoice {$invoice->invoice_number} ditolak. Alasan: {$reason}",
            $invoice,
            ['reason' => $reason]
        );

        return response()->json([
            'message' => 'Bukti pembayaran ditolak.',
            'invoice' => new InvoiceResource($invoice->fresh()->load(['customer', 'items', 'payments'])),
        ]);
    }
}
