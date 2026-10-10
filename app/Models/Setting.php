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

    /**
     * Dynamically configure Laravel mail settings using company's stored SMTP configuration.
     */
    public static function configureMailForCompany(int $companyId): void
    {
        $settings = self::where('company_id', $companyId)->pluck('value', 'key');
        $company = Company::find($companyId);

        $mailer = $settings['mailer'] ?? 'smtp';
        config(['mail.default' => $mailer]);

        if (!empty($settings['smtp_host'])) {
            $encryption = $settings['smtp_encryption'] ?? 'tls';
            if ($encryption === 'none' || empty($encryption)) {
                $encryption = null;
            }

            config([
                'mail.mailers.smtp.transport' => 'smtp',
                'mail.mailers.smtp.host' => $settings['smtp_host'],
                'mail.mailers.smtp.port' => (int) ($settings['smtp_port'] ?? 587),
                'mail.mailers.smtp.encryption' => $encryption,
                'mail.mailers.smtp.username' => $settings['smtp_username'] ?? null,
                'mail.mailers.smtp.password' => $settings['smtp_password'] ?? null,
            ]);
        }

        $fromAddress = $settings['from_address'] ?? $company?->email ?? config('mail.from.address');
        $fromName = $settings['from_name'] ?? $company?->name ?? config('mail.from.name');

        if ($fromAddress) {
            config([
                'mail.from.address' => $fromAddress,
                'mail.from.name' => $fromName,
            ]);
        }
    }
}
