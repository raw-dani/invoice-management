<?php

namespace App\Services;

use App\Models\Setting;
use App\Support\Security\EnvironmentValidator;

class LicenseService
{
    protected string $storagePath;

    public function __construct()
    {
        // Disimpan di dalam framework system cache terenkripsi
        $this->storagePath = storage_path('framework/system');
        if (!is_dir($this->storagePath)) {
            @mkdir($this->storagePath, 0755, true);
        }
    }

    /**
     * Get instance of EnvironmentValidator initialized with company or env config.
     */
    public function getGuard(?int $companyId = null, ?string $customServerUrl = null, ?string $customApiKey = null): EnvironmentValidator
    {
        $serverUrl = $customServerUrl
            ?: ($companyId ? Setting::getValue($companyId, 'license_server_url') : null)
            ?: config('services.license.server_url', env('LICENSE_SERVER_URL', 'https://license.eikon.id'));

        $apiKey = $customApiKey
            ?: ($companyId ? Setting::getValue($companyId, 'license_api_key') : null)
            ?: config('services.license.api_key', env('LICENSE_API_KEY', ''));

        $productSlug = config('services.license.product_slug', env('LICENSE_PRODUCT_SLUG', 'invoice-management'));
        $graceHours = (int) config('services.license.grace_period_hours', env('LICENSE_GRACE_PERIOD', 24));

        return new EnvironmentValidator(
            $serverUrl ?: 'https://license.eikon.id',
            $apiKey ?: '',
            $this->storagePath,
            $productSlug,
            $graceHours
        );
    }

    /**
     * Get complete license status for the company and current environment.
     */
    public function getStatus(int $companyId): array
    {
        $guard = $this->getGuard($companyId);
        $currentInstallId = $guard->getInstallId();
        $domain = $guard->getDomain();
        $fingerprint = $guard->getFingerprint();

        $localData = $guard->readStorageData();

        // Database settings fallback
        $dbLicenseKey = Setting::getValue($companyId, 'license_key');
        $serverUrl = Setting::getValue($companyId, 'license_server_url') ?: env('LICENSE_SERVER_URL', 'https://license.eikon.id');
        $apiKey = Setting::getValue($companyId, 'license_api_key') ?: env('LICENSE_API_KEY', '');

        $licenseKey = $localData['license_key'] ?? $dbLicenseKey;
        $expiresAt = $localData['expires_at'] ?? Setting::getValue($companyId, 'license_expires_at');
        $lastChecked = isset($localData['last_checked']) ? date('c', $localData['last_checked']) : null;
        $registeredInstallId = $localData['install_id'] ?? null;
        $registeredDomain = $localData['domain'] ?? null;

        // Determine status
        $status = 'unlicensed';
        $statusMessage = 'Aplikasi belum diaktivasi lisensi resmi.';

        if (!empty($licenseKey)) {
            if (!empty($registeredInstallId) && $registeredInstallId !== $currentInstallId) {
                $status = 'invalid_machine';
                $statusMessage = 'Perangkat keras / Install ID server tidak cocok dengan lisensi terdaftar.';
            } elseif (!empty($expiresAt) && strtotime($expiresAt) < time()) {
                $status = 'expired';
                $statusMessage = 'Lisensi telah kedaluwarsa pada ' . date('d M Y', strtotime($expiresAt)) . '.';
            } else {
                $status = 'active';
                $statusMessage = 'Lisensi aktif dan terdaftar secara sah.';
            }
        }

        return [
            'is_licensed' => $status === 'active',
            'status' => $status,
            'status_message' => $statusMessage,
            'license_key' => $licenseKey,
            'masked_license_key' => $licenseKey ? $this->maskKey($licenseKey) : null,
            'expires_at' => $expiresAt,
            'last_checked' => $lastChecked,
            'server_url' => $serverUrl,
            'api_key' => $apiKey ? $this->maskKey($apiKey, 3) : null,
            'registered_domain' => $registeredDomain,
            'current_domain' => $domain,
            'install_id' => $currentInstallId,
            'registered_install_id' => $registeredInstallId,
            'fingerprint' => $fingerprint,
            'grace_period_hours' => 24,
            'device_info' => [
                'hostname' => php_uname('n'),
                'os' => PHP_OS,
                'php_version' => PHP_VERSION,
                'server_ip' => $_SERVER['SERVER_ADDR'] ?? '127.0.0.1',
                'app_root' => base_path(),
            ],
        ];
    }

    /**
     * Activate a license key with license manager server.
     */
    public function activate(int $companyId, string $licenseKey, ?string $serverUrl = null, ?string $apiKey = null): array
    {
        $licenseKey = trim($licenseKey);
        if (empty($licenseKey)) {
            return ['status' => 'error', 'message' => 'Kunci lisensi tidak boleh kosong.'];
        }

        // Save server URL and API key if supplied
        if ($serverUrl !== null) {
            Setting::setValue($companyId, 'license_server_url', trim($serverUrl));
        }
        if ($apiKey !== null) {
            Setting::setValue($companyId, 'license_api_key', trim($apiKey));
        }

        $guard = $this->getGuard($companyId, $serverUrl, $apiKey);
        $result = $guard->activateLicense($licenseKey);

        if (($result['status'] ?? '') === 'success') {
            Setting::setValue($companyId, 'license_key', $licenseKey);
            if (!empty($result['data']['expires_at'])) {
                Setting::setValue($companyId, 'license_expires_at', $result['data']['expires_at']);
            }
            Setting::setValue($companyId, 'license_status', 'active');
            Setting::setValue($companyId, 'license_install_id', $guard->getInstallId());
            Setting::setValue($companyId, 'license_registered_domain', $guard->getDomain());
        }

        return $result;
    }

    /**
     * Verify license with server.
     */
    public function verify(int $companyId): array
    {
        $status = $this->getStatus($companyId);
        $licenseKey = $status['license_key'];

        if (empty($licenseKey)) {
            return ['status' => 'error', 'message' => 'Belum ada lisensi yang terdaftar untuk diverifikasi.'];
        }

        $guard = $this->getGuard($companyId);
        $result = $guard->verifyWithServer($licenseKey);

        if (($result['status'] ?? '') === 'success') {
            $data = $guard->readStorageData();
            $data['license_key'] = $licenseKey;
            $data['token'] = $result['data']['token'] ?? ($data['token'] ?? null);
            $data['expires_at'] = $result['data']['expires_at'] ?? null;
            $data['last_checked'] = time();
            $data['install_id'] = $guard->getInstallId();
            $data['domain'] = $guard->getDomain();
            $guard->writeStorageData($data);

            Setting::setValue($companyId, 'license_status', 'active');
            if (!empty($result['data']['expires_at'])) {
                Setting::setValue($companyId, 'license_expires_at', $result['data']['expires_at']);
            }
        }

        return $result;
    }

    /**
     * Revoke / deactivate license so it can be used on another server.
     */
    public function revoke(int $companyId): array
    {
        $guard = $this->getGuard($companyId);
        $hadLicenseBefore = !empty($guard->readStorageData())
            || !empty(Setting::getValue($companyId, 'license_key'));

        $result = $guard->revokeLicense();

        // Ensure encrypted local storage and database settings are cleared
        $guard->deleteStorageData();

        Setting::setValue($companyId, 'license_key', null);
        Setting::setValue($companyId, 'license_status', 'unlicensed');
        Setting::setValue($companyId, 'license_expires_at', null);
        Setting::setValue($companyId, 'license_install_id', null);
        Setting::setValue($companyId, 'license_registered_domain', null);

        if (($result['status'] ?? '') === 'success' || $hadLicenseBefore) {
            return [
                'status' => 'success',
                'message' => 'Lisensi berhasil dicabut.',
            ];
        }

        return $result;
    }

    /**
     * Mask license key or API key for secure display.
     */
    protected function maskKey(string $key, int $visible = 4): string
    {
        $len = strlen($key);
        if ($len <= $visible * 2) {
            return str_repeat('*', $len);
        }
        $start = substr($key, 0, $visible);
        $end = substr($key, -$visible);
        return $start . str_repeat('•', max(4, $len - ($visible * 2))) . $end;
    }
}
