<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CollectionLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'collection_task_id',
        'customer_id',
        'invoice_id',
        'user_id',
        'channel', // phone, whatsapp, email, visit
        'contact_person',
        'outcome', // connected_ptp, connected_no_ptp, no_answer, wrong_number, dispute, other
        'promise_to_pay_date',
        'promise_to_pay_amount',
        'notes',
    ];

    protected $casts = [
        'promise_to_pay_date' => 'date',
        'promise_to_pay_amount' => 'decimal:2',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function collectionTask(): BelongsTo
    {
        return $this->belongsTo(CollectionTask::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
