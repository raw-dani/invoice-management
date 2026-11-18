<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DebitNote extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'customer_id',
        'invoice_id',
        'debit_note_number',
        'debit_note_date',
        'status', // draft, open, paid, void
        'reason',
        'subtotal',
        'tax_rate',
        'tax_amount',
        'total',
        'paid_amount',
        'currency',
        'notes',
    ];

    protected $casts = [
        'debit_note_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total' => 'decimal:2',
        'paid_amount' => 'decimal:2',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(DebitNoteItem::class);
    }

    public static function generateNumber(int $companyId): string
    {
        $year = date('Y');
        $prefix = "DN-{$year}-";

        $lastNumber = static::where('company_id', $companyId)
            ->where('debit_note_number', 'like', "{$prefix}%")
            ->orderByDesc('debit_note_number')
            ->value('debit_note_number');

        if ($lastNumber) {
            $seq = (int) substr($lastNumber, strlen($prefix)) + 1;
        } else {
            $seq = 1;
        }

        return $prefix . str_pad((string) $seq, 5, '0', STR_PAD_LEFT);
    }
}
