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
            'public_token'   => $this->public_token,
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
            'milestones'     => $this->whenLoaded('milestones', fn () => $this->milestones->map(fn ($m) => [
                'id' => $m->id,
                'sequence' => $m->sequence,
                'name' => $m->name,
                'percentage' => (float) $m->percentage,
                'amount' => (float) $m->amount,
                'due_date' => $m->due_date?->toDateString(),
                'status' => $m->status,
                'notes' => $m->notes,
                'invoice_id' => $m->invoice_id,
                'invoice_number' => $m->invoice?->invoice_number,
                'invoice_status' => $m->invoice?->status,
            ])),
            'created_at'     => $this->created_at?->toIso8601String(),
            'updated_at'     => $this->updated_at?->toIso8601String(),
        ];
    }
}
