<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Quote;

class EmailTemplateRenderer
{
    /**
     * Build the context array for variable substitution.
     */
    public function buildContext(string $type, $model, array $extra = []): array
    {
        $company = auth()->user()?->company;

        $ctx = [
            'company' => [
                'name'    => $company?->name ?? 'Your Company',
                'email'   => $company?->email ?? '',
                'phone'   => $company?->phone ?? '',
                'address' => $company?->address ?? '',
                'website' => $company?->website ?? '',
            ],
        ];

        if ($type === 'invoice' && $model instanceof Invoice) {
            $model->loadMissing('customer');
            $customer = $model->customer;
            $ctx['invoice'] = [
                'number'   => $model->invoice_number,
                'date'     => $model->invoice_date?->format('d M Y'),
                'due_date' => $model->due_date?->format('d M Y'),
                'subtotal' => number_format($model->subtotal, 2),
                'tax'      => number_format($model->tax_amount, 2),
                'total'    => number_format($model->total, 2),
                'paid'     => number_format($model->paid_amount, 2),
                'balance'  => number_format($model->balance, 2),
                'currency' => $model->currency,
                'status'   => $model->status,
            ];
            $ctx['customer'] = [
                'name'  => $customer?->company_name ?? '',
                'email' => $customer?->email ?? '',
            ];
        }

        if ($type === 'quote' && $model instanceof Quote) {
            $model->loadMissing('customer');
            $customer = $model->customer;
            $ctx['quote'] = [
                'number'     => $model->quote_number,
                'date'       => $model->quote_date?->format('d M Y'),
                'valid_until' => $model->valid_until?->format('d M Y') ?? '',
                'subtotal'   => number_format($model->subtotal, 2),
                'tax'        => number_format($model->tax_amount, 2),
                'total'      => number_format($model->total, 2),
                'currency'   => $model->currency,
                'status'     => $model->status,
            ];
            $ctx['customer'] = [
                'name'  => $customer?->company_name ?? '',
                'email' => $customer?->email ?? '',
            ];
        }

        if ($type === 'payment' && $model instanceof Payment) {
            $ctx['payment'] = [
                'number'        => $model->payment_number,
                'date'          => $model->payment_date?->format('d M Y'),
                'amount'        => number_format($model->amount, 2),
                'currency'      => $model->currency,
                'method'        => $model->method_label ?? ucwords(str_replace('_', ' ', $model->payment_method)),
                'reference'     => $model->reference ?? '',
            ];
            $ctx['customer'] = [
                'name'  => $model->customer?->company_name ?? '',
                'email' => $model->customer?->email ?? '',
            ];
        }

        return array_merge($ctx, $extra);
    }

    /**
     * Render a template string with {{dot.notation}} variables.
     */
    public function render(string $template, array $context): string
    {
        return preg_replace_callback('/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/', function ($m) use ($context) {
            $parts = explode('.', $m[1]);
            $value = $context;
            foreach ($parts as $p) {
                if (is_array($value) && array_key_exists($p, $value)) {
                    $value = $value[$p];
                } else {
                    return ''; // missing variable = empty string
                }
            }
            return is_scalar($value) ? (string) $value : '';
        }, $template);
    }
}
