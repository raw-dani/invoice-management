<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id'              => 'required|exists:customers,id',
            'invoice_date'             => 'required|date',
            'due_date'                 => 'required|date|after_or_equal:invoice_date',
            'currency'                 => 'required|string|size:3',
            'discount'                 => 'nullable|numeric|min:0',
            'discount_type'            => 'required|in:0,1',
            'tax_rate'                 => 'nullable|numeric|min:0|max:100',
            'notes'                    => 'nullable|string',
            'terms'                    => 'nullable|string',
            'quote_id'                 => 'nullable|exists:quotes,id',
            'milestone_name'           => 'nullable|string|max:255',
            'milestone_sequence'       => 'nullable|integer|min:1',
            'milestone_total_termins'  => 'nullable|integer|min:1',
            'milestone_percentage'     => 'nullable|numeric|min:0|max:100',
            'items'                    => 'required|array|min:1',
            'items.*.product_id'       => 'nullable|exists:products,id',
            'items.*.description'      => 'required|string',
            'items.*.quantity'         => 'required|numeric|min:0.01',
            'items.*.unit_price'       => 'required|numeric|min:0',
            'items.*.discount'         => 'nullable|numeric|min:0',
            'items.*.tax_rate'         => 'nullable|numeric|min:0|max:100',
        ];
    }
}
