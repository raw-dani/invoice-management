<?php

namespace App\Services;

use App\Models\Quote;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;

class QuoteService
{
    public function convertToInvoice(Quote $quote): Invoice
    {
        return DB::transaction(function () use ($quote): Invoice {
            $dueDays = (int) (Setting::getValue($quote->company_id, 'due_days', 30) ?: 30);

            $invoice = Invoice::create([
                'company_id' => $quote->company_id,
                'customer_id' => $quote->customer_id,
                'invoice_number' => Invoice::generateInvoiceNumber($quote->company_id),
                'invoice_date' => now()->toDateString(),
                'due_date' => now()->addDays($dueDays)->toDateString(),
                'status' => 'draft',
                'currency' => $quote->currency,
                'discount' => $quote->discount,
                'discount_type' => $quote->discount_type,
                'tax_rate' => $quote->tax_rate,
                'notes' => $quote->notes,
                'terms' => $quote->terms,
                'quote_id' => $quote->id,
                'paid_amount' => 0,
            ]);

            foreach ($quote->items as $quoteItem) {
                $invoiceItem = new InvoiceItem([
                    'product_id' => $quoteItem->product_id,
                    'description' => $quoteItem->description,
                    'quantity' => $quoteItem->quantity,
                    'unit_price' => $quoteItem->unit_price,
                    'discount' => $quoteItem->discount,
                    'tax_rate' => $quoteItem->tax_rate,
                    'tax_amount' => $quoteItem->tax_amount,
                    'total' => $quoteItem->total,
                ]);
                $invoice->items()->save($invoiceItem);
            }

            $invoice->subtotal = $quote->subtotal;
            $invoice->tax_amount = $quote->tax_amount;
            $invoice->total = $quote->total;
            $invoice->balance = $invoice->total;
            $invoice->save();

            $quote->update([
                'status' => 'converted',
                'invoice_id' => $invoice->id,
            ]);

            return $invoice;
        });
    }
}