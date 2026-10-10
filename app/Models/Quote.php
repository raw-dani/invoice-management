<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quote extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'company_id',
        'quote_number',
        'customer_id',
        'quote_date',
        'valid_until',
        'status',
        'subtotal',
        'discount',
        'discount_type',
        'tax_rate',
        'tax_amount',
        'total',
        'currency',
        'notes',
        'terms',
        'invoice_id',
        'is_demo',
    ];

    protected $casts = [
        'quote_date' => 'date',
        'valid_until' => 'date',
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'discount_type' => 'integer',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total' => 'decimal:2',
        'is_demo' => 'boolean',
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
        return $this->hasMany(QuoteItem::class);
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public static function generateQuoteNumber(int $companyId): string
    {
        $year = date('Y');
        $lastQuote = self::query()
            ->whereYear('created_at', $year)
            ->orderBy('id', 'desc')
            ->first();
        $number = $lastQuote ? (int) substr($lastQuote->quote_number, -5) + 1 : 1;
        return 'QT-' . $year . '-' . str_pad($number, 5, '0', STR_PAD_LEFT);
    }

    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'draft' => 'gray',
            'sent' => 'blue',
            'viewed' => 'purple',
            'accepted' => 'green',
            'rejected' => 'red',
            'expired' => 'yellow',
            'converted' => 'indigo',
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
            // applied once at the quote level below (single Tax line).
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
        $this->save();
    }
}
