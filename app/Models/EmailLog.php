<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmailLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'template_slug',
        'mailable_class',
        'to_email',
        'subject',
        'context',
        'status',
        'error_message',
        'sent_at',
    ];

    protected $casts = [
        'context' => 'array',
        'sent_at' => 'datetime',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
