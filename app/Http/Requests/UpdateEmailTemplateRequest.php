<?php

namespace App\Http\Requests;

class UpdateEmailTemplateRequest extends StoreEmailTemplateRequest
{
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'body' => 'required|string',
        ];
    }
}