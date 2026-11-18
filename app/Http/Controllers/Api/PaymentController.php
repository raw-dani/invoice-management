<?php

namespace App\Http\Controllers\Api;

use App\Events\InvoicePaid;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Http\Requests\StorePaymentRequest;
use App\Jobs\SendPaymentReceiptEmail;
use App\Http\Resources\PaymentResource;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\PdfService;
use App\Services\NotifyUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class PaymentController extends Controller
{
    private function authorizeCompany(Payment $payment): void
    {
        if ($payment->company_id !== auth()->user()->company_id) {
            abort(403, 'Unauthorized action.');
        }
    }

    private function authorizeInvoice(Invoice $invoice): void
    {
        if ($invoice->company_id !== auth()->user()->company_id) {
            abort(403, 'Unauthorized action.');
        }
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Payment::with(['customer', 'invoice'])
            ->where('company_id', auth()->user()->company_id);

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('payment_number', 'like', "%{$search}%")
                  ->orWhere('reference', 'like', "%{$search}%");
            });
        }

        if ($request->filled('invoice_id')) {
            $query->where('invoice_id', $request->integer('invoice_id'));
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->integer('customer_id'));
        }

        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->string('payment_method'));
        }

        if ($request->filled('from')) {
            $query->whereDate('payment_date', '>=', $request->date('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('payment_date', '<=', $request->date('to'));
        }

        $perPage = min((int) $request->input('per_page', 15), 100);
        $payments = $query->latest('payment_date')->paginate($perPage);

        return PaymentResource::collection($payments);
    }

    public function store(StorePaymentRequest $request, Invoice $invoice): JsonResponse
    {
        $data = $request->validated();

        $this->authorize('manage', $invoice);

        // Guard: don't allow payment on locked statuses
        if (in_array($invoice->status, ['paid', 'void', 'cancelled'], true)) {
            return response()->json([
                'message' => "Cannot record payment on invoice with status '{$invoice->status}'.",
            ], 422);
        }

        // Guard: amount must not exceed remaining balance
        if ((float) $data['amount'] > (float) $invoice->balance) {
            return response()->json([
                'message' => 'Payment amount exceeds invoice balance.',
                'balance' => (float) $invoice->balance,
            ], 422);
        }

        $payment = DB::transaction(function () use ($invoice, $data) {
            $payment = Payment::create([
                'company_id'     => auth()->user()->company_id,
                'customer_id'    => $invoice->customer_id,
                'invoice_id'     => $invoice->id,
                'payment_number' => Payment::generatePaymentNumber(auth()->user()->company_id),
                'payment_date'   => $data['payment_date'],
                'amount'         => $data['amount'],
                'currency'       => $data['currency'],
                'payment_method' => $data['payment_method'],
                'reference'      => $data['reference'] ?? null,
                'notes'          => $data['notes'] ?? null,
            ]);

            $transitioned = $invoice->applyPayment((float) $data['amount']);

            if ($transitioned) {
                InvoicePaid::dispatch($invoice->fresh());
            }

            ActivityLog::record('payment.recorded', "Payment {$payment->payment_number} recorded", $payment, [
                'invoice_id' => $invoice->id,
                'amount' => (float) $payment->amount,
            ]);

            return $payment;
        });

        SendPaymentReceiptEmail::dispatch($payment->id);

        app(NotifyUser::class)->company((string) $invoice->company_id, 'payment_received', 'Payment received', "Payment {$payment->payment_number} was recorded.", [
            'payment_id' => $payment->id,
            'invoice_id' => $invoice->id,
        ]);

        return (new PaymentResource($payment->load(['customer', 'invoice'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Payment $payment): PaymentResource
    {
        $this->authorize('view', $payment);
        return new PaymentResource($payment->load(['customer', 'invoice', 'allocations.invoice']));
    }

    /**
     * Record a multi-invoice allocation payment.
     * Can receive a single bulk payment amount and allocate it across several open invoices.
     * Any remainder is saved as the customer's credit balance (deposit).
     */
    public function storeMulti(Request $request): JsonResponse
    {
        $companyId = auth()->user()->company_id;

        $validated = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_date' => ['required', 'date'],
            'payment_method' => ['required', 'string'],
            'reference' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'allocations' => ['nullable', 'array'],
            'allocations.*.invoice_id' => ['required', 'exists:invoices,id'],
            'allocations.*.amount' => ['required', 'numeric', 'min:0.01'],
        ]);

        $customer = \App\Models\Customer::where('company_id', $companyId)->findOrFail($validated['customer_id']);

        return DB::transaction(function () use ($validated, $companyId, $customer) {
            $totalAmount = (float) $validated['amount'];
            $totalAllocated = 0;

            $payment = Payment::create([
                'company_id' => $companyId,
                'customer_id' => $customer->id,
                'invoice_id' => null, // Multi-allocation payment
                'payment_number' => Payment::generatePaymentNumber($companyId),
                'payment_date' => $validated['payment_date'],
                'amount' => $totalAmount,
                'allocated_amount' => 0,
                'unallocated_amount' => $totalAmount,
                'is_multi_allocation' => true,
                'currency' => 'IDR',
                'payment_method' => $validated['payment_method'],
                'reference' => $validated['reference'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            if (!empty($validated['allocations'])) {
                foreach ($validated['allocations'] as $alloc) {
                    $invoice = Invoice::where('company_id', $companyId)
                        ->where('customer_id', $customer->id)
                        ->find($alloc['invoice_id']);

                    if (!$invoice || (float) $invoice->balance <= 0) {
                        continue;
                    }

                    $allocAmt = min((float) $alloc['amount'], (float) $invoice->balance);
                    if ($allocAmt <= 0) {
                        continue;
                    }

                    \App\Models\InvoicePaymentAllocation::create([
                        'payment_id' => $payment->id,
                        'invoice_id' => $invoice->id,
                        'amount' => $allocAmt,
                        'allocated_at' => $payment->payment_date,
                        'notes' => 'Alokasi multi-invoice',
                    ]);

                    $transitioned = $invoice->applyPayment($allocAmt);
                    if ($transitioned) {
                        InvoicePaid::dispatch($invoice->fresh());
                    }

                    $totalAllocated += $allocAmt;
                }
            }

            $unallocated = max(0, $totalAmount - $totalAllocated);
            $payment->allocated_amount = $totalAllocated;
            $payment->unallocated_amount = $unallocated;
            $payment->save();

            // Store any unallocated balance into customer's credit balance deposit
            if ($unallocated > 0) {
                $customer->credit_balance = (float) $customer->credit_balance + $unallocated;
                $customer->save();
            }

            ActivityLog::record('payment.multi_recorded', "Multi-payment {$payment->payment_number} recorded", $payment, [
                'customer_id' => $customer->id,
                'total_amount' => $totalAmount,
                'allocated' => $totalAllocated,
                'unallocated_credit' => $unallocated,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pembayaran berhasil dialokasikan.',
                'data' => $payment->load(['allocations.invoice', 'customer']),
            ], 201);
        });
    }

    public function destroy(Payment $payment): JsonResponse
    {
        $this->authorize('delete', $payment);

        $invoice = $payment->invoice;
        if ($invoice && in_array($invoice->status, ['void', 'cancelled'], true)) {
            return response()->json([
                'message' => 'Cannot delete payment from void or cancelled invoice.',
            ], 422);
        }

        DB::transaction(function () use ($payment, $invoice) {
            ActivityLog::record('payment.deleted', "Payment {$payment->payment_number} reversed", $payment, [
                'invoice_id' => $invoice?->id,
                'amount' => (float) $payment->amount,
            ]);
            $payment->delete();
            if ($invoice) {
                $invoice->refresh();
                $invoice->reversePayment((float) $payment->amount);
            }
        });

        return response()->json(['message' => 'Payment deleted successfully.']);
    }

    public function receipt(Payment $payment, PdfService $pdf): Response
    {
        $this->authorize('view', $payment);
        $payment->load('customer', 'invoice');

        $pdfContent = $pdf->renderPaymentReceipt($payment);
        $filename = "receipt-{$payment->payment_number}.pdf";

        return response()->make($pdfContent, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => "inline; filename=\"{$filename}\"",
        ]);
    }
}
