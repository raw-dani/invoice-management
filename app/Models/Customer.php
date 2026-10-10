<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'customer_number',
        'company_name',
        'contact_name',
        'email',
        'phone',
        'address',
        'city',
        'province',
        'country',
        'tax_number',
        'notes',
        'status',
        'is_demo',
    ];

    protected $casts = [
        'is_demo' => 'boolean',
    ];

    /**
     * Get the company that owns the customer.
     */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    protected static function booted(): void
    {
        static::creating(function (Customer $customer) {
            if (!$customer->customer_number) {
                $customer->customer_number = self::generateCustomerNumber($customer->company_id);
            }
        });
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function quotes()
    {
        return $this->hasMany(Quote::class);
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Generate customer number.
     */
    public static function generateCustomerNumber(int $companyId): string
    {
        $lastCustomer = self::orderBy('id', 'desc')->first();
        $number = $lastCustomer ? (int) substr($lastCustomer->customer_number, -5) + 1 : 1;
        return 'CUST-' . str_pad($number, 5, '0', STR_PAD_LEFT);
    }

    /**
     * Get status badge color.
     */
    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'lead' => 'yellow',
            'active' => 'green',
            'inactive' => 'gray',
            default => 'gray',
        };
    }
}
