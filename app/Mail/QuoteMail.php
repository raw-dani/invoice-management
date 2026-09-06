<?php

namespace App\Mail;

use App\Models\Company;
use App\Models\Quote;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class QuoteMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Quote $quote,
        public string $renderedSubject,
        public string $renderedBody,
        public ?string $pdfContent = null,
        public ?string $pdfFilename = null,
    ) {
    }

    public function envelope(): Envelope
    {
        $company = $this->quote->company ?? Company::find($this->quote->company_id);
        $fromName = $company?->name ?? config('app.name');
        $fromEmail = $company?->email ?? config('mail.from.address');

        return new Envelope(
            from: new Address($fromEmail, $fromName),
            subject: $this->renderedSubject,
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: $this->renderedBody,
        );
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        if (!$this->pdfContent) {
            return [];
        }

        return [
            Attachment::fromData(fn () => $this->pdfContent, $this->pdfFilename ?? 'quote.pdf')
                ->withMime('application/pdf'),
        ];
    }
}
