<?php

namespace App\Jobs;

use App\Mail\PaymentReceiptMail;
use App\Models\EmailLog;
use App\Models\EmailTemplate;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\EmailTemplateRenderer;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Send the payment receipt email (payment received confirmation)
 * with the receipt PDF attached.
 */
class SendPaymentReceiptEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $paymentId, public ?string $toEmail = null)
    {
    }

    public function handle(EmailTemplateRenderer $renderer, \App\Services\PdfService $pdfService): void
    {
        $payment = Payment::with('invoice.customer', 'invoice.company', 'company')->find($this->paymentId);
        if (!$payment) {
            return;
        }

        $invoice = $payment->invoice;
        if (!$invoice) {
            return;
        }

        $to = $this->toEmail ?: $payment->customer?->email ?: $invoice->customer?->email;
        if (!$to) {
            return;
        }

        $template = EmailTemplate::resolve($invoice->company_id, 'payment_received');
        if (!$template) {
            Log::warning('SendPaymentReceiptEmail: no payment_received template found');
            return;
        }

        $context = $renderer->buildContext('invoice', $invoice, [
            'payment' => [
                'amount'    => number_format((float) $payment->amount, 2),
                'method'    => $payment->payment_method,
                'reference' => $payment->reference ?? '',
                'date'      => $payment->payment_date?->format('d M Y'),
            ],
        ]);
        $subject = $renderer->render($template->subject, $context);
        $body = $renderer->render($template->body, $context);

        $pdfContent = null;
        try {
            $pdfContent = $pdfService->renderPaymentReceipt($payment);
        } catch (\Throwable $e) {
            Log::warning('SendPaymentReceiptEmail: receipt PDF failed', ['error' => $e->getMessage()]);
        }

        $log = EmailLog::create([
            'company_id'     => $invoice->company_id,
            'template_slug'  => $template->slug,
            'mailable_class' => PaymentReceiptMail::class,
            'to_email'       => $to,
            'subject'        => $subject,
            'context'        => ['invoice_id' => $invoice->id, 'payment_id' => $payment->id],
            'status'         => 'queued',
        ]);

        try {
            Mail::to($to)->send(
                new PaymentReceiptMail($invoice, $subject, $body, $pdfContent, 'receipt-' . $payment->payment_number . '.pdf')
            );
            $log->update(['status' => 'sent', 'sent_at' => now()]);
        } catch (\Throwable $e) {
            $log->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);
            Log::error('SendPaymentReceiptEmail failed', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);
            throw $e; // allow queue retry
        }
    }
}
