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
        $data = $request->validated();

        $invoice = Invoice::create([
            'company_id'      => auth()->user()->company_id,
            'customer_id'     => $data['customer_id'],
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

        return (new InvoiceResource($invoice->load('customer', 'items.product')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Invoice $invoice): InvoiceResource
    {
        $this->authorizeCompany($invoice);

        return new InvoiceResource(
            $invoice->load('customer', 'items.product', 'payments')
        );
    }

    public function update(UpdateInvoiceRequest $request, Invoice $invoice): InvoiceResource
    {
        $this->authorizeCompany($invoice);

        if ($invoice->status !== 'draft') {
            abort(422, 'Only draft invoices can be edited.');
        }

        $data = $request->validated();

        $invoice->update(collect($data)->except('items')->toArray());
        $invoice->items()->delete();
        foreach ($data['items'] as $item) {
            $invoice->items()->create($item);
        }

        $invoice->refresh()->load('items');
        $invoice->calculateTotals();

        return new InvoiceResource($invoice->load('customer', 'items.product'));
    }

    public function destroy(Invoice $invoice): JsonResponse
    {
        $this->authorizeCompany($invoice);

        if (!in_array($invoice->status, ['draft', 'cancelled'], true)) {
            abort(422, 'Only draft or cancelled invoices can be deleted.');
        }

        $invoice->delete();
        ActivityLog::record('invoice.deleted', "Invoice {$invoice->invoice_number} deleted", $invoice);

        return response()->json(['message' => 'Invoice deleted successfully.']);
    }

    public function duplicate(Invoice $invoice): JsonResponse
    {
        $this->authorizeCompany($invoice);
        $invoice->load('items');

        $duplicate = \Illuminate\Support\Facades\DB::transaction(function () use ($invoice): Invoice {
            $copy = $invoice->replicate(['invoice_number', 'status', 'paid_amount', 'balance']);
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
        $this->authorizeCompany($invoice);

        if ($invoice->status !== 'draft') {
            abort(422, 'Only draft invoices can be marked as sent.');
        }

        $invoice->update(['status' => 'sent']);
        ActivityLog::record('invoice.sent', "Invoice {$invoice->invoice_number} marked as sent", $invoice);

        return new InvoiceResource($invoice->fresh()->load('customer', 'items.product'));
    }

    public function void(Invoice $invoice): InvoiceResource
    {
        $this->authorizeCompany($invoice);

        if (in_array($invoice->status, ['paid', 'void'], true)) {
            abort(422, 'Paid or void invoices cannot be voided.');
        }

        $invoice->update(['status' => 'void']);
        ActivityLog::record('invoice.voided', "Invoice {$invoice->invoice_number} voided", $invoice);

        return new InvoiceResource($invoice->fresh()->load('customer', 'items.product'));
    }

    public function pdf(Invoice $invoice, PdfService $pdf): Response
    {
        $this->authorizeCompany($invoice);
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
}
