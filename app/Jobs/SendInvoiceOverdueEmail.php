<?php

namespace App\Jobs;

/**
 * Overdue reminder (final notice) — reuses SendPaymentReminder
 * with kind = 'overdue' which resolves the 'invoice_overdue' template.
 */
class SendInvoiceOverdueEmail extends SendPaymentReminder
{
    public function __construct(public int $invoiceId)
    {
        parent::__construct($invoiceId, 'overdue');
    }
}
