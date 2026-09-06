<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'company_name' => 'required|string|max:255',
            'contact_name' => 'nullable|string|max:255',
            'email'        => 'nullable|email|max:255',
            'phone'        => 'nullable|string|max:255',
            'address'      => 'nullable|string',
            'city'         => 'nullable|string|max:255',
            'province'     => 'nullable|string|max:255',
            'country'      => 'nullable|string|max:255',
            'tax_number'   => 'nullable|string|max:255',
            'notes'        => 'nullable|string',
            'status'       => 'required|in:lead,active,inactive',
        ];
    }
}
