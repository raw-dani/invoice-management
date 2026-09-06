<?php

namespace App\Mail;

use App\Models\Company;
use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvoicePaidMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Invoice $invoice,
        public string $renderedSubject,
        public string $renderedBody,
    ) {
    }

    public function envelope(): Envelope
    {
        $company = $this->invoice->company ?? Company::find($this->invoice->company_id);
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
}
