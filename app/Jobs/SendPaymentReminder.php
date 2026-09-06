<?php

namespace App\Jobs;

use App\Mail\PaymentReminderMail;
use App\Models\EmailLog;
use App\Models\EmailTemplate;
use App\Models\Invoice;
use App\Services\EmailTemplateRenderer;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Send a payment reminder / overdue email for an invoice.
 * Kind: 'reminder' (due soon) or 'overdue' (past due date).
 */
class SendPaymentReminder implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $invoiceId,
        public string $kind = 'reminder',
    ) {
    }

    public function handle(EmailTemplateRenderer $renderer): void
    {
        $invoice = Invoice::with('customer', 'company')->find($this->invoiceId);
        if (!$invoice) {
            return;
        }

        // Skip if the invoice has been settled or is no longer actionable.
        if (!in_array($invoice->status, ['sent', 'partially_paid', 'overdue'], true)) {
            return;
        }

        $customer = $invoice->customer;
        if (!$customer || !$customer->email) {
            return;
        }

        $slug = $this->kind === 'overdue' ? 'invoice_overdue' : 'payment_reminder';
        $template = EmailTemplate::resolve($invoice->company_id, $slug);
        if (!$template) {
            Log::warning("SendPaymentReminder: no {$slug} template found");
            return;
        }

        $context = $renderer->buildContext('invoice', $invoice);
        $subject = $renderer->render($template->subject, $context);
        $body = $renderer->render($template->body, $context);

        $log = EmailLog::create([
            'company_id'     => $invoice->company_id,
            'template_slug'  => $template->slug,
            'mailable_class' => PaymentReminderMail::class,
            'to_email'       => $customer->email,
            'subject'        => $subject,
            'context'        => ['invoice_id' => $invoice->id, 'kind' => $this->kind],
            'status'         => 'queued',
        ]);

        try {
            Mail::to($customer->email)->send(
                new PaymentReminderMail($invoice, $subject, $body, $this->kind)
            );
            $log->update(['status' => 'sent', 'sent_at' => now()]);
        } catch (\Throwable $e) {
            $log->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);
            Log::error('SendPaymentReminder failed', [
                'invoice_id' => $invoice->id,
                'kind' => $this->kind,
                'error' => $e->getMessage(),
            ]);
            throw $e; // allow queue retry
        }
    }
}
