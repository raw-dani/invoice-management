<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'          => 'required|string|max:255',
            'description'   => 'nullable|string',
            'type'          => 'required|in:one_time,subscription',
            'price'         => 'required|numeric|min:0',
            'currency'      => 'required|string|size:3',
            'tax_rate'      => 'nullable|numeric|min:0|max:100',
            'billing_cycle' => 'nullable|required_if:type,subscription|in:monthly,quarterly,semi_annual,yearly',
            'status'        => 'required|in:active,inactive',
            'notes'         => 'nullable|string',
        ];
    }
}
