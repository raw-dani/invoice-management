<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BillingSchedule extends Model
{
    protected $fillable = [
        'company_id',
        'subscription_id',
        'billing_date',
        'status',
        'invoice_id',
        'error_message',
        'processed_at',
    ];

    protected $casts = [
        'billing_date' => 'date',
        'processed_at' => 'datetime',
    ];

    public function subscription()
    {
        return $this->belongsTo(Subscription::class);
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}