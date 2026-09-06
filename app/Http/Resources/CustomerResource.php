<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'company_id'      => $this->company_id,
            'customer_number' => $this->customer_number,
            'company_name'    => $this->company_name,
            'contact_name'    => $this->contact_name,
            'email'           => $this->email,
            'phone'           => $this->phone,
            'address'         => $this->address,
            'city'            => $this->city,
            'province'        => $this->province,
            'country'         => $this->country,
            'tax_number'      => $this->tax_number,
            'notes'           => $this->notes,
            'status'          => $this->status,
            'status_color'    => $this->status_color,
            'created_at'      => $this->created_at?->toIso8601String(),
            'updated_at'      => $this->updated_at?->toIso8601String(),
        ];
    }
}
