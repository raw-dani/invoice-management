<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubscriptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'customer_id' => $this->customer_id,
            'subscription_number' => $this->subscription_number,
            'status' => $this->status,
            'billing_cycle' => $this->billing_cycle,
            'start_date' => $this->start_date?->toDateString(),
            'next_billing_date' => $this->next_billing_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'invoice_due_days' => (int) $this->invoice_due_days,
            'currency' => $this->currency,
            'notes' => $this->notes,
            'customer' => $this->whenLoaded('customer', fn () => new CustomerResource($this->customer)),
            'items' => $this->whenLoaded('items', fn () => SubscriptionItemResource::collection($this->items)),
            'invoices' => $this->whenLoaded('invoices', fn () => InvoiceResource::collection($this->invoices)),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}