<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'company_id'      => $this->company_id,
            'customer_id'     => $this->customer_id,
            'subscription_id' => $this->subscription_id,
            'quote_id'        => $this->quote_id,
            'milestone_name'  => $this->milestone_name,
            'milestone_sequence' => $this->milestone_sequence,
            'milestone_total_termins' => $this->milestone_total_termins,
            'milestone_percentage' => $this->milestone_percentage !== null ? (float) $this->milestone_percentage : null,
            'invoice_number'  => $this->invoice_number,
            'invoice_type'    => $this->invoice_type ?? 'standard',
            'public_token'    => $this->public_token,
            'invoice_date'    => $this->invoice_date?->toDateString(),
            'due_date'        => $this->due_date?->toDateString(),
            'status'          => $this->status,
            'status_color'    => $this->status_color,
            'approval_status' => $this->approval_status ?? 'not_required',
            'approved_by_user_id' => $this->approved_by_user_id,
            'approved_at'     => $this->approved_at ? (is_string($this->approved_at) ? $this->approved_at : $this->approved_at->toIso8601String()) : null,
            'rejection_reason'=> $this->rejection_reason,
            'approver'        => $this->whenLoaded('approver', fn () => [
                'id' => $this->approver->id,
                'name' => $this->approver->name,
                'email' => $this->approver->email,
            ]),
            'subtotal'        => (float) $this->subtotal,
            'discount'        => (float) $this->discount,
            'discount_type'   => (int) $this->discount_type,
            'tax_rate'        => (float) $this->tax_rate,
            'tax_amount'      => (float) $this->tax_amount,
            'withholding_tax_type' => $this->withholding_tax_type,
            'withholding_tax_rate' => (float) $this->withholding_tax_rate,
            'withholding_tax_amount' => (float) $this->withholding_tax_amount,
            'withholding_tax_slip_number' => $this->withholding_tax_slip_number,
            'withholding_tax_slip_date' => $this->withholding_tax_slip_date?->toDateString(),
            'tax_invoice_number' => $this->tax_invoice_number,
            'total'           => (float) $this->total,
            'paid_amount'     => (float) $this->paid_amount,
            'balance'         => (float) $this->balance,
            'currency'        => $this->currency,
            'notes'           => $this->notes,
            'terms'           => $this->terms,
            'payment_proof_path' => $this->payment_proof_path ? (str_starts_with($this->payment_proof_path, 'http') ? $this->payment_proof_path : '/storage/' . $this->payment_proof_path) : null,
            'payment_proof_status' => $this->payment_proof_status ?? 'none',
            'payment_proof_notes' => $this->payment_proof_notes,
            'payment_proof_uploaded_at' => $this->payment_proof_uploaded_at?->toIso8601String(),
            'customer'        => $this->whenLoaded('customer', fn () => new CustomerResource($this->customer)),
            'items'           => $this->whenLoaded('items', fn () => InvoiceItemResource::collection($this->items)),
            'payments'        => $this->whenLoaded('payments', fn () => \App\Http\Resources\PaymentResource::collection($this->payments)),
            'created_at'      => $this->created_at?->toIso8601String(),
            'updated_at'      => $this->updated_at?->toIso8601String(),
        ];
    }
}
