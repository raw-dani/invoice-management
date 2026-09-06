<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'company_id'     => $this->company_id,
            'customer_id'    => $this->customer_id,
            'invoice_id'     => $this->invoice_id,
            'payment_number' => $this->payment_number,
            'payment_date'   => $this->payment_date?->toDateString(),
            'amount'         => (float) $this->amount,
            'currency'       => $this->currency,
            'payment_method' => $this->payment_method,
            'method_label'   => $this->method_label,
            'reference'      => $this->reference,
            'notes'          => $this->notes,
            'customer'       => $this->whenLoaded('customer', fn () => new CustomerResource($this->customer)),
            'invoice'        => $this->whenLoaded('invoice', fn () => [
                'id'             => $this->invoice->id,
                'invoice_number' => $this->invoice->invoice_number,
                'total'          => (float) $this->invoice->total,
                'balance'        => (float) $this->invoice->balance,
                'status'         => $this->invoice->status,
            ]),
            'created_at'     => $this->created_at?->toIso8601String(),
            'updated_at'     => $this->updated_at?->toIso8601String(),
        ];
    }
}
