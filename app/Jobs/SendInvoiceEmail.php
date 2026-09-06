<?php

namespace App\Jobs;

use App\Mail\InvoiceMail;
use App\Models\EmailLog;
use App\Models\EmailTemplate;
use App\Models\Invoice;
use App\Services\EmailTemplateRenderer;
use App\Services\PdfService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendInvoiceEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $invoiceId, public ?int $templateId = null)
    {
    }

    public function handle(EmailTemplateRenderer $renderer, PdfService $pdf): void
    {
        $invoice = Invoice::with('customer', 'company', 'items.product')->find($this->invoiceId);
        if (!$invoice) {
            Log::warning('SendInvoiceEmail: invoice not found', ['id' => $this->invoiceId]);
            return;
        }

        $customer = $invoice->customer;
        if (!$customer || !$customer->email) {
            Log::warning('SendInvoiceEmail: customer missing email', ['invoice_id' => $invoice->id]);
            return;
        }

        $template = $this->templateId
            ? EmailTemplate::find($this->templateId)
            : EmailTemplate::resolve($invoice->company_id, 'invoice');

        if (!$template) {
            Log::error('SendInvoiceEmail: no template found', ['slug' => 'invoice']);
            return;
        }

        $context = $renderer->buildContext('invoice', $invoice);
        $subject = $renderer->render($template->subject, $context);
        $body = $renderer->render($template->body, $context);

        // Generate PDF for attachment
        $pdfContent = $pdf->renderInvoice($invoice);
        $pdfFilename = "invoice-{$invoice->invoice_number}.pdf";

        $log = EmailLog::create([
            'company_id'     => $invoice->company_id,
            'template_slug'  => $template->slug,
            'mailable_class' => InvoiceMail::class,
            'to_email'       => $customer->email,
            'subject'        => $subject,
            'context'        => ['invoice_id' => $invoice->id],
            'status'         => 'queued',
        ]);

        try {
            Mail::to($customer->email)->send(
                new InvoiceMail($invoice, $subject, $body, $pdfContent, $pdfFilename)
            );
            $log->update(['status' => 'sent', 'sent_at' => now()]);
        } catch (\Throwable $e) {
            $log->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);
            Log::error('SendInvoiceEmail failed', [
                'invoice_id' => $invoice->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
