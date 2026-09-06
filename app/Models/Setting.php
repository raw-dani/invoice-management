<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'key',
        'value',
    ];

    /**
     * Get the company that owns the setting.
     */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get a setting value by key for a company.
     */
    public static function getValue(int $companyId, string $key, $default = null)
    {
        $setting = self::where('company_id', $companyId)->where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    /**
     * Set a setting value for a company.
     */
    public static function setValue(int $companyId, string $key, $value)
    {
        return self::updateOrCreate(
            ['company_id' => $companyId, 'key' => $key],
            ['value' => $value]
        );
    }
}
