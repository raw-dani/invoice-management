<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionItem extends Model
{
    protected $fillable = [
        'subscription_id',
        'product_id',
        'description',
        'quantity',
        'unit_price',
        'discount',
        'tax_rate',
        'tax_amount',
        'total',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'discount' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    protected static function booted(): void
    {
        // Auto-calculate line totals so the stored `total` is never stale/zero.
        static::saving(function (SubscriptionItem $item) {
            $lineTotal = max(0, (float) $item->quantity * (float) $item->unit_price - (float) $item->discount);
            $item->tax_amount = round($lineTotal * ((float) $item->tax_rate / 100), 2);
            $item->total = round($lineTotal, 2);
        });
    }

    public function subscription()
    {
        return $this->belongsTo(Subscription::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}