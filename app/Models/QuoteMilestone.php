<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuoteMilestone extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'quote_id',
        'invoice_id',
        'sequence',
        'name',
        'percentage',
        'amount',
        'due_date',
        'status',
        'notes',
    ];

    protected $casts = [
        'sequence' => 'integer',
        'percentage' => 'decimal:2',
        'amount' => 'decimal:2',
        'due_date' => 'date',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function quote()
    {
        return $this->belongsTo(Quote::class);
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}
