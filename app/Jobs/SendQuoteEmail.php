<?php

namespace App\Jobs;

use App\Mail\QuoteMail;
use App\Models\EmailLog;
use App\Models\EmailTemplate;
use App\Models\Quote;
use App\Services\EmailTemplateRenderer;
use App\Services\PdfService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendQuoteEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $quoteId, public ?int $templateId = null)
    {
    }

    public function handle(EmailTemplateRenderer $renderer, PdfService $pdf): void
    {
        $quote = Quote::with('customer', 'company', 'items.product')->find($this->quoteId);
        if (!$quote) {
            Log::warning('SendQuoteEmail: quote not found', ['id' => $this->quoteId]);
            return;
        }

        $customer = $quote->customer;
        if (!$customer || !$customer->email) {
            Log::warning('SendQuoteEmail: customer missing email', ['quote_id' => $quote->id]);
            return;
        }

        $template = $this->templateId
            ? EmailTemplate::find($this->templateId)
            : EmailTemplate::resolve($quote->company_id, 'quote');

        if (!$template) {
            Log::error('SendQuoteEmail: no template found', ['slug' => 'quote']);
            return;
        }

        $context = $renderer->buildContext('quote', $quote);
        $subject = $renderer->render($template->subject, $context);
        $body = $renderer->render($template->body, $context);

        $pdfContent = $pdf->renderQuote($quote);
        $pdfFilename = "quote-{$quote->quote_number}.pdf";

        $log = EmailLog::create([
            'company_id'     => $quote->company_id,
            'template_slug'  => $template->slug,
            'mailable_class' => QuoteMail::class,
            'to_email'       => $customer->email,
            'subject'        => $subject,
            'context'        => ['quote_id' => $quote->id],
            'status'         => 'queued',
        ]);

        try {
            Mail::to($customer->email)->send(
                new QuoteMail($quote, $subject, $body, $pdfContent, $pdfFilename)
            );
            $log->update(['status' => 'sent', 'sent_at' => now()]);
        } catch (\Throwable $e) {
            $log->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);
            Log::error('SendQuoteEmail failed', [
                'quote_id' => $quote->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
