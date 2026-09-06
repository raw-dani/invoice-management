<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaxRate extends Model
{
    use HasFactory;

    protected $fillable = ['company_id', 'name', 'rate', 'is_default', 'is_active'];

    protected $casts = ['rate' => 'decimal:2', 'is_default' => 'boolean', 'is_active' => 'boolean'];
}