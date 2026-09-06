<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'invoice_id'     => 'nullable|exists:invoices,id',
            'payment_date'   => 'required|date',
            'amount'         => 'required|numeric|min:0.01',
            'currency'       => 'required|string|size:3',
            'payment_method' => 'required|in:bank_transfer,cash,credit_card,e_wallet,other',
            'reference'      => 'nullable|string|max:255',
            'notes'          => 'nullable|string',
        ];
    }
}
