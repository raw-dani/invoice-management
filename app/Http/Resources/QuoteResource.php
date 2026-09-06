<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuoteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'company_id'     => $this->company_id,
            'customer_id'    => $this->customer_id,
            'invoice_id'     => $this->invoice_id,
            'quote_number'   => $this->quote_number,
            'quote_date'     => $this->quote_date?->toDateString(),
            'valid_until'    => $this->valid_until?->toDateString(),
            'status'         => $this->status,
            'status_color'   => $this->status_color,
            'subtotal'       => (float) $this->subtotal,
            'discount'       => (float) $this->discount,
            'discount_type'  => (int) $this->discount_type,
            'tax_rate'       => (float) $this->tax_rate,
            'tax_amount'     => (float) $this->tax_amount,
            'total'          => (float) $this->total,
            'currency'       => $this->currency,
            'notes'          => $this->notes,
            'terms'          => $this->terms,
            'customer'       => $this->whenLoaded('customer', fn () => new CustomerResource($this->customer)),
            'items'          => $this->whenLoaded('items', fn () => QuoteItemResource::collection($this->items)),
            'created_at'     => $this->created_at?->toIso8601String(),
            'updated_at'     => $this->updated_at?->toIso8601String(),
        ];
    }
}
