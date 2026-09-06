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

        $this->authorizeInvoice($invoice);

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
        $this->authorizeCompany($payment);
        return new PaymentResource($payment->load(['customer', 'invoice']));
    }

    public function destroy(Payment $payment): JsonResponse
    {
        $this->authorizeCompany($payment);

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
        $this->authorizeCompany($payment);
        $payment->load('customer', 'invoice');

        $pdfContent = $pdf->renderPaymentReceipt($payment);
        $filename = "receipt-{$payment->payment_number}.pdf";

        return response()->make($pdfContent, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => "inline; filename=\"{$filename}\"",
        ]);
    }
}
