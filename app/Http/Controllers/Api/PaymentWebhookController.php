<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentWebhookController extends Controller
{
    public function handle(Request $request, string $gateway): JsonResponse
    {
        Log::info("Payment webhook received for gateway: {$gateway}", $request->all());

        try {
            return match (strtolower($gateway)) {
                'midtrans' => $this->handleMidtrans($request),
                'xendit'   => $this->handleXendit($request),
                'doku'     => $this->handleDoku($request),
                'duitku'   => $this->handleDuitku($request),
                default    => response()->json(['message' => 'Unknown gateway.'], 400),
            };
        } catch (\Throwable $e) {
            Log::error("Payment webhook error ({$gateway}): " . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Webhook processing error', 'error' => $e->getMessage()], 500);
        }
    }

    private function handleMidtrans(Request $request): JsonResponse
    {
        $orderId = (string) $request->input('order_id');
        $transactionStatus = (string) $request->input('transaction_status');
        $fraudStatus = (string) $request->input('fraud_status');
        $grossAmount = (float) $request->input('gross_amount');
        $paymentType = (string) $request->input('payment_type');

        // Extract invoice number (supports INV-0001 or INV-0001-172856)
        $invoiceNumber = explode('-', $orderId, 3);
        $cleanNumber = count($invoiceNumber) >= 2 ? "{$invoiceNumber[0]}-{$invoiceNumber[1]}" : $orderId;

        $invoice = Invoice::where('invoice_number', $orderId)
            ->orWhere('invoice_number', $cleanNumber)
            ->first();

        if (!$invoice) {
            return response()->json(['message' => 'Invoice not found.'], 404);
        }

        $isSuccess = ($transactionStatus === 'capture' && $fraudStatus === 'accept') || $transactionStatus === 'settlement';

        if ($isSuccess && !in_array($invoice->status, ['paid', 'void', 'cancelled'], true)) {
            $this->recordGatewayPayment(
                $invoice,
                $grossAmount ?: (float) $invoice->balance,
                'midtrans',
                $paymentType,
                $request->input('transaction_id') ?: $orderId
            );
        }

        return response()->json(['status' => 'ok', 'message' => 'Midtrans notification processed.']);
    }

    private function handleXendit(Request $request): JsonResponse
    {
        $externalId = (string) $request->input('external_id');
        $status = strtoupper((string) $request->input('status'));
        $paidAmount = (float) ($request->input('paid_amount') ?: $request->input('amount'));

        $invoice = Invoice::where('invoice_number', $externalId)->first();
        if (!$invoice) {
            return response()->json(['message' => 'Invoice not found.'], 404);
        }

        if (in_array($status, ['PAID', 'SETTLED', 'COMPLETED'], true) && !in_array($invoice->status, ['paid', 'void', 'cancelled'], true)) {
            $this->recordGatewayPayment(
                $invoice,
                $paidAmount ?: (float) $invoice->balance,
                'xendit',
                (string) ($request->input('payment_method') ?: $request->input('payment_channel')),
                (string) ($request->input('id') ?: $externalId)
            );
        }

        return response()->json(['status' => 'ok', 'message' => 'Xendit notification processed.']);
    }

    private function handleDoku(Request $request): JsonResponse
    {
        $invoiceNumber = (string) $request->input('order.invoice_number');
        $status = strtoupper((string) $request->input('transaction.status'));
        $amount = (float) $request->input('order.amount');

        $invoice = Invoice::where('invoice_number', $invoiceNumber)->first();
        if (!$invoice) {
            return response()->json(['message' => 'Invoice not found.'], 404);
        }

        if ($status === 'SUCCESS' && !in_array($invoice->status, ['paid', 'void', 'cancelled'], true)) {
            $this->recordGatewayPayment(
                $invoice,
                $amount ?: (float) $invoice->balance,
                'doku',
                (string) $request->input('channel.id'),
                (string) $request->input('transaction.id')
            );
        }

        return response()->json(['status' => 'ok', 'message' => 'DOKU notification processed.']);
    }

    private function handleDuitku(Request $request): JsonResponse
    {
        $merchantOrderId = (string) $request->input('merchantOrderId');
        $resultCode = (string) $request->input('resultCode');
        $amount = (float) $request->input('amount');

        $invoice = Invoice::where('invoice_number', $merchantOrderId)->first();
        if (!$invoice) {
            return response()->json(['message' => 'Invoice not found.'], 404);
        }

        if ($resultCode === '00' && !in_array($invoice->status, ['paid', 'void', 'cancelled'], true)) {
            $this->recordGatewayPayment(
                $invoice,
                $amount ?: (float) $invoice->balance,
                'duitku',
                (string) $request->input('paymentCode'),
                (string) $request->input('reference')
            );
        }

        return response()->json(['status' => 'ok', 'message' => 'Duitku notification processed.']);
    }

    private function recordGatewayPayment(
        Invoice $invoice,
        float $amount,
        string $gateway,
        string $paymentType,
        string $reference
    ): void {
        DB::transaction(function () use ($invoice, $amount, $gateway, $paymentType, $reference) {
            $method = match (strtolower($paymentType)) {
                'credit_card', 'cc' => 'credit_card',
                'qris', 'gopay', 'shopeepay', 'ovo', 'dana', 'linkaja', 'e-wallet', 'ewallet' => 'e_wallet',
                default => 'bank_transfer',
            };

            $payAmount = min($amount, (float) $invoice->balance);

            $payment = Payment::create([
                'company_id'     => $invoice->company_id,
                'customer_id'    => $invoice->customer_id,
                'invoice_id'     => $invoice->id,
                'payment_number' => Payment::generatePaymentNumber($invoice->company_id),
                'payment_date'   => now()->toDateString(),
                'amount'         => $payAmount,
                'currency'       => $invoice->currency,
                'payment_method' => $method,
                'reference'      => strtoupper($gateway) . ": {$reference}",
                'notes'          => "Pembayaran otomatis via " . ucfirst($gateway) . " ({$paymentType})",
            ]);

            $invoice->applyPayment($payAmount);

            ActivityLog::record(
                'payment.gateway_webhook',
                "Pembayaran otomatis via {$gateway} untuk invoice {$invoice->invoice_number} berhasil diterima.",
                $payment,
                ['gateway' => $gateway, 'amount' => $payAmount, 'reference' => $reference]
            );
        });
    }
}
