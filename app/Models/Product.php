<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'sku',
        'name',
        'description',
        'type',
        'price',
        'currency',
        'tax_rate',
        'billing_cycle',
        'status',
        'notes',
        'is_demo',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'is_demo' => 'boolean',
    ];

    /**
     * Get the company that owns the product.
     */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Generate SKU.
     */
    public static function generateSku(int $companyId): string
    {
        $lastProduct = self::orderBy('id', 'desc')->first();
        $number = $lastProduct ? (int) substr($lastProduct->sku, -5) + 1 : 1;
        return 'PRD-' . str_pad($number, 5, '0', STR_PAD_LEFT);
    }

    /**
     * Get type label.
     */
    public function getTypeLabelAttribute(): string
    {
        return $this->type === 'one_time' ? 'One Time' : 'Subscription';
    }

    /**
     * Get billing cycle label.
     */
    public function getBillingCycleLabelAttribute(): string
    {
        return match($this->billing_cycle) {
            'monthly' => 'Monthly',
            'quarterly' => 'Quarterly',
            'semi_annual' => 'Semi Annual',
            'yearly' => 'Yearly',
            default => '-',
        };
    }

    /**
     * Check if product is subscription type.
     */
    public function isSubscription(): bool
    {
        return $this->type === 'subscription';
    }

    /**
     * Check if product is one time type.
     */
    public function isOneTime(): bool
    {
        return $this->type === 'one_time';
    }
}
