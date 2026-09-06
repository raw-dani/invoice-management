<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                   => $this->id,
            'company_id'           => $this->company_id,
            'sku'                  => $this->sku,
            'name'                 => $this->name,
            'description'          => $this->description,
            'type'                 => $this->type,
            'type_label'           => $this->type_label,
            'price'                => (float) $this->price,
            'currency'             => $this->currency,
            'tax_rate'             => (float) $this->tax_rate,
            'billing_cycle'        => $this->billing_cycle,
            'billing_cycle_label'  => $this->billing_cycle_label,
            'status'               => $this->status,
            'notes'                => $this->notes,
            'is_subscription'      => $this->isSubscription(),
            'is_one_time'          => $this->isOneTime(),
            'created_at'           => $this->created_at?->toIso8601String(),
            'updated_at'           => $this->updated_at?->toIso8601String(),
        ];
    }
}
