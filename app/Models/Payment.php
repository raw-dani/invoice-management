<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'customer_id',
        'invoice_id',
        'payment_number',
        'payment_date',
        'amount',
        'currency',
        'payment_method',
        'reference',
        'notes',
        'is_demo',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'amount'       => 'decimal:2',
        'is_demo'      => 'boolean',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public static function generatePaymentNumber(int $companyId): string
    {
        $year = date('Y');
        $last = self::query()
            ->whereYear('created_at', $year)
            ->orderBy('id', 'desc')
            ->first();
        $number = $last ? (int) substr($last->payment_number, -5) + 1 : 1;
        return 'PAY-' . $year . '-' . str_pad($number, 5, '0', STR_PAD_LEFT);
    }

    public function getMethodLabelAttribute(): string
    {
        return match ($this->payment_method) {
            'bank_transfer' => 'Bank Transfer',
            'cash'          => 'Cash',
            'credit_card'   => 'Credit Card',
            'e_wallet'      => 'E-Wallet',
            'other'         => 'Other',
            default         => ucfirst(str_replace('_', ' ', (string) $this->payment_method)),
        };
    }
}
