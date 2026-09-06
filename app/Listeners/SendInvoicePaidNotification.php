<?php

namespace App\Listeners;

use App\Events\InvoicePaid;
use App\Jobs\SendInvoicePaidEmail;
use App\Services\NotifyUser;

class SendInvoicePaidNotification
{
    public function __construct(private NotifyUser $notify)
    {
    }

    public function handle(InvoicePaid $event): void
    {
        SendInvoicePaidEmail::dispatch($event->invoice->id);
        $this->notify->company((string) $event->invoice->company_id, 'invoice_paid', 'Invoice paid', "Invoice {$event->invoice->invoice_number} has been paid.", [
            'invoice_id' => $event->invoice->id,
        ]);
    }
}
