<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = ['company_id', 'user_id', 'type', 'title', 'body', 'data', 'read_at', 'is_demo'];

    protected $casts = ['data' => 'array', 'read_at' => 'datetime', 'is_demo' => 'boolean'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}