<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'customer_id',
        'subscription_id',
        'quote_id',
        'invoice_number',
        'invoice_date',
        'due_date',
        'status',
        'subtotal',
        'discount',
        'discount_type',
        'tax_rate',
        'tax_amount',
        'total',
        'paid_amount',
        'balance',
        'currency',
        'notes',
        'terms',
    ];

    protected $casts = [
        'invoice_date' => 'date',
        'due_date' => 'date',
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'discount_type' => 'integer',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'balance' => 'decimal:2',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function subscription()
    {
        return $this->belongsTo(Subscription::class);
    }

    public static function generateInvoiceNumber(int $companyId): string
    {
        $year = date('Y');
        $lastInvoice = self::query()
            ->whereYear('created_at', $year)
            ->orderBy('id', 'desc')
            ->first();
        $number = $lastInvoice ? (int) substr($lastInvoice->invoice_number, -5) + 1 : 1;
        return 'INV-' . $year . '-' . str_pad($number, 5, '0', STR_PAD_LEFT);
    }

    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'draft' => 'gray',
            'sent' => 'blue',
            'partially_paid' => 'yellow',
            'paid' => 'green',
            'overdue' => 'red',
            'cancelled' => 'gray',
            'void' => 'gray',
            default => 'gray',
        };
    }

    public function calculateTotals(): void
    {
        $subtotal = 0;
        foreach ($this->items as $item) {
            // Line total is the pre-tax (net of per-line discount) amount.
            $lineTotal = max(0, ($item->quantity * $item->unit_price) - $item->discount);
            // Snapshot the per-line tax for reference; the billable tax is
            // applied once at the invoice level below (single Tax line).
            $item->tax_amount = $lineTotal * ($item->tax_rate / 100);
            $item->total = $lineTotal;
            $item->save();
            $subtotal += $lineTotal;
        }

        $this->subtotal = $subtotal;

        if ($this->discount_type == 1) {
            $discountAmount = $subtotal * ($this->discount / 100);
        } else {
            $discountAmount = $this->discount;
        }

        $afterDiscount = max(0, $subtotal - $discountAmount);
        $this->tax_amount = $afterDiscount * ($this->tax_rate / 100);
        $this->total = $afterDiscount + $this->tax_amount;
        $this->balance = $this->total - $this->paid_amount;
        $this->save();
    }

    /**
     * Apply a payment amount to this invoice and transition status accordingly.
     * Returns true if the invoice transitioned to Paid by this payment.
     */
    public function applyPayment(float $amount): bool
    {
        $this->paid_amount = (float) $this->paid_amount + $amount;
        $this->balance = (float) $this->total - (float) $this->paid_amount;

        // Don't change status of locked terminal states
        if (in_array($this->status, ['paid', 'void', 'cancelled'], true)) {
            $this->save();
            return $this->status === 'paid';
        }

        if ($this->balance <= 0) {
            $this->balance = 0;
            $this->status = 'paid';
            $this->save();
            return true;
        }

        // Has previous payments or new one made it partial
        if ((float) $this->paid_amount > 0 && in_array($this->status, ['draft', 'sent', 'overdue'], true)) {
            $this->status = 'partially_paid';
        }

        $this->save();
        return false;
    }

    /**
     * Reverse a payment (e.g. on delete). Re-evaluate status from scratch.
     */
    public function reversePayment(float $amount): void
    {
        if (in_array($this->status, ['void', 'cancelled'], true)) {
            return;
        }
        $this->paid_amount = max(0, (float) $this->paid_amount - $amount);
        $this->balance = max(0, (float) $this->total - (float) $this->paid_amount);

        // Re-evaluate status from paid amount
        if ((float) $this->paid_amount <= 0) {
            // All payments reversed: revert to 'sent' if it was paid by this flow
            $this->status = 'sent';
        } elseif ((float) $this->paid_amount < (float) $this->total) {
            $this->status = 'partially_paid';
        }
        // else: still fully paid

        $this->save();
    }
}
