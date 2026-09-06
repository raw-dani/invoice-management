<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'customer_id',
        'subscription_number',
        'status',
        'billing_cycle',
        'start_date',
        'next_billing_date',
        'end_date',
        'invoice_due_days',
        'currency',
        'notes',
    ];

    protected $casts = [
        'start_date' => 'date',
        'next_billing_date' => 'date',
        'end_date' => 'date',
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
        return $this->hasMany(SubscriptionItem::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function billingSchedules()
    {
        return $this->hasMany(BillingSchedule::class);
    }

    public static function generateSubscriptionNumber(int $companyId): string
    {
        $year = date('Y');
        $last = self::query()
            ->whereYear('created_at', $year)
            ->latest('id')
            ->first();
        $number = $last ? (int) substr($last->subscription_number, -5) + 1 : 1;

        return 'SUB-' . $year . '-' . str_pad($number, 5, '0', STR_PAD_LEFT);
    }

    public function advanceBillingDate(): void
    {
        $date = Carbon::parse($this->next_billing_date);
        $this->next_billing_date = match ($this->billing_cycle) {
            'monthly' => $date->addMonthNoOverflow(),
            'quarterly' => $date->addMonthsNoOverflow(3),
            'semi_annual' => $date->addMonthsNoOverflow(6),
            'yearly' => $date->addYearNoOverflow(),
        };
    }
}