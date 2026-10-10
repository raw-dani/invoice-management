<?php

namespace App\Jobs;

use App\Mail\InvoicePaidMail;
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

class SendInvoicePaidEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $invoiceId)
    {
    }

    public function handle(EmailTemplateRenderer $renderer): void
    {
        $invoice = Invoice::with('customer', 'company')->find($this->invoiceId);
        if (!$invoice) {
            return;
        }

        $customer = $invoice->customer;
        if (!$customer || !$customer->email) {
            return;
        }

        $template = EmailTemplate::resolve($invoice->company_id, 'invoice_paid');
        if (!$template) {
            Log::warning('SendInvoicePaidEmail: no template found');
            return;
        }

        $context = $renderer->buildContext('invoice', $invoice);
        $subject = $renderer->render($template->subject, $context);
        $body = $renderer->render($template->body, $context);

        $log = EmailLog::create([
            'company_id'     => $invoice->company_id,
            'template_slug'  => $template->slug,
            'mailable_class' => InvoicePaidMail::class,
            'to_email'       => $customer->email,
            'subject'        => $subject,
            'context'        => ['invoice_id' => $invoice->id],
            'status'         => 'queued',
        ]);

        try {
            Mail::to($customer->email)->send(
                new InvoicePaidMail($invoice, $subject, $body)
            );
            $log->update(['status' => 'sent', 'sent_at' => now()]);
        } catch (\Throwable $e) {
            $log->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);
            Log::error('SendInvoicePaidEmail failed', [
                'invoice_id' => $invoice->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
