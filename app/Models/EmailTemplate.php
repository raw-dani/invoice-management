<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmailTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'slug',
        'name',
        'subject',
        'body',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    public const SLUGS = [
        'invoice',
        'invoice_paid',
        'invoice_overdue',
        'payment_reminder',
        'quote',
        'quote_accepted',
        'payment_received',
    ];

    /**
     * Resolve template for a company (fall back to global default with company_id = null).
     */
    public static function resolve(int $companyId, string $slug): ?self
    {
        $tpl = self::where('company_id', $companyId)->where('slug', $slug)->first();
        if ($tpl) return $tpl;
        return self::where('company_id', null)->where('slug', $slug)->first();
    }
}
