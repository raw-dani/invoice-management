<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvoiceTemplate extends Model
{
    use HasFactory;

    protected $fillable = ['company_id', 'slug', 'name', 'is_active', 'is_default'];

    protected $casts = ['is_active' => 'boolean', 'is_default' => 'boolean'];
}