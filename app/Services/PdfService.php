<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Quote;
use App\Models\InvoiceTemplate;
use App\Models\QuoteTemplate;
use Barryvdh\DomPDF\Facade\Pdf;

class PdfService
{
    /**
     * Render invoice PDF and return raw bytes.
     */
    public function renderInvoice(Invoice $invoice, ?string $template = null): string
    {
        $invoice->loadMissing(['customer', 'items.product', 'company']);
        $company = $invoice->company ?? $this->resolveCompany();

        $bankKeys = ['bank_name', 'account_name', 'account_number', 'instructions'];
        $bank = \App\Models\Setting::where('company_id', $invoice->company_id)
            ->whereIn('key', $bankKeys)
            ->pluck('value', 'key');

        return Pdf::loadView($this->invoiceView($invoice->company_id, $template), [
            'invoice' => $invoice,
            'company' => $company,
            'bank'    => $bank,
            'type'    => 'Invoice',
        ])
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled'      => false,
                'defaultFont'          => 'sans-serif',
            ])
            ->output();
    }

    /**
     * Render quote PDF.
     */
    public function renderQuote(Quote $quote, ?string $template = null): string
    {
        $quote->loadMissing(['customer', 'items.product', 'company']);
        $company = $quote->company ?? $this->resolveCompany();

        return Pdf::loadView($this->quoteView($quote->company_id, $template), [
            'quote'   => $quote,
            'company' => $company,
            'type'    => 'Quote',
        ])
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled'      => false,
                'defaultFont'          => 'sans-serif',
            ])
            ->output();
    }

    /**
     * Render payment receipt PDF.
     */
    public function renderPaymentReceipt(Payment $payment): string
    {
        $payment->loadMissing(['customer', 'invoice', 'company']);
        $company = $payment->company ?? $this->resolveCompany();

        return Pdf::loadView('pdf.payment.receipt', [
            'payment' => $payment,
            'invoice' => $payment->invoice,
            'customer' => $payment->customer,
            'company' => $company,
        ])
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled'      => false,
                'defaultFont'          => 'sans-serif',
            ])
            ->output();
    }

    private function resolveCompany(): Company
    {
        $user = auth()->user();
        if ($user && $user->company_id) {
            return Company::find($user->company_id) ?? new Company(['name' => 'Your Company']);
        }
        return new Company(['name' => 'Your Company']);
    }

    private function invoiceView(int $companyId, ?string $requested): string
    {
        $slug = $requested ?: InvoiceTemplate::where('company_id', $companyId)
            ->where('is_default', true)
            ->value('slug');
        $slug ??= InvoiceTemplate::whereNull('company_id')
            ->where('is_default', true)
            ->value('slug');
        $slug ??= 'modern';

        return match ($slug) {
            'professional' => 'pdf.invoice.professional',
            'classic' => 'pdf.invoice.classic',
            'compact' => 'pdf.invoice.compact',
            default => 'pdf.invoice.modern',
        };
    }

    private function quoteView(int $companyId, ?string $requested): string
    {
        $slug = $requested ?: QuoteTemplate::where('company_id', $companyId)
            ->where('is_default', true)
            ->value('slug');
        $slug ??= QuoteTemplate::whereNull('company_id')
            ->where('is_default', true)
            ->value('slug');
        $slug ??= 'modern';

        return match ($slug) {
            'professional' => 'pdf.quote.professional',
            'corporate' => 'pdf.quote.corporate',
            'classic' => 'pdf.quote.classic',
            default => 'pdf.quote.modern',
        };
    }
}
