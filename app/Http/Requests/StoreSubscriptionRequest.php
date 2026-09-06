<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSubscriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => 'required|exists:customers,id',
            'status' => 'required|in:draft,active,paused,cancelled,expired',
            'billing_cycle' => 'required|in:monthly,quarterly,semi_annual,yearly',
            'start_date' => 'required|date',
            'next_billing_date' => 'required|date|after_or_equal:start_date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'invoice_due_days' => 'required|integer|min:0|max:365',
            'currency' => 'required|string|size:3',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
        ];
    }
}