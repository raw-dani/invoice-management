<?php

namespace App\Support\Security;

use Illuminate\Support\Facades\Crypt;

/**
 * EnvironmentValidator - System Environment & Infrastructure Validation
 *
 * Mengelola integritas instalasi, tanda tangan hardware (Install ID),
 * dan verifikasi sertifikat lingkungan aplikasi.
 */
class EnvironmentValidator
{
    protected string $serverUrl;
    protected string $apiKey;
    protected string $storagePath;
    protected ?string $productSlug;
    protected int $gracePeriodHours;

    public function __construct(
        string $serverUrl,
        string $apiKey,
        string $storagePath,
        ?string $productSlug = null,
        int $gracePeriodHours = 24
    ) {
        $this->serverUrl = rtrim($serverUrl, '/');
        $this->apiKey = $apiKey;
        $this->storagePath = rtrim($storagePath, '/\\');
        $this->productSlug = $productSlug;
        $this->gracePeriodHours = $gracePeriodHours;

        if (!is_dir($this->storagePath)) {
            @mkdir($this->storagePath, 0755, true);
        }
    }

    /**
     * Jalur penyimpanan file tanda tangan sistem yang terenkripsi.
     */
    public function getStorageFile(): string
    {
        return $this->storagePath . '/.sys_env_signature';
    }

    /**
     * Membaca dan mendekripsi data lisensi/signature lokal.
     */
    public function readStorageData(): array
    {
        $file = $this->getStorageFile();
        if (file_exists($file)) {
            $raw = @file_get_contents($file);
            if ($raw) {
                try {
                    $json = Crypt::decryptString($raw);
                    $data = json_decode($json, true);
                    if (is_array($data)) {
                        return $data;
                    }
                } catch (\Throwable $e) {
                    $data = json_decode($raw, true);
                    if (is_array($data)) {
                        return $data;
                    }
                }
            }
        }

        // Kompatibilitas mundur: baca jika ada .app_license.json lama
        $legacy = $this->storagePath . '/.app_license.json';
        if (file_exists($legacy)) {
            $data = json_decode(@file_get_contents($legacy), true) ?: [];
            if (!empty($data)) {
                $this->writeStorageData($data);
                @unlink($legacy);
                return $data;
            }
        }

        return [];
    }

    /**
     * Menulis data lisensi/signature lokal dalam format terenkripsi AES-256.
     */
    public function writeStorageData(array $data): bool
    {
        $file = $this->getStorageFile();
        $json = json_encode($data, JSON_PRETTY_PRINT);
        try {
            $payload = Crypt::encryptString($json);
        } catch (\Throwable $e) {
            $payload = $json;
        }
        return @file_put_contents($file, $payload) !== false;
    }

    /**
     * Menghapus file signature lokal.
     */
    public function deleteStorageData(): bool
    {
        $deleted = false;
        $file = $this->getStorageFile();
        if (file_exists($file)) {
            $deleted = @unlink($file);
        }
        $legacy = $this->storagePath . '/.app_license.json';
        if (file_exists($legacy)) {
            $deleted = @unlink($legacy) || $deleted;
        }
        return $deleted;
    }

    /**
     * Hitung Install ID unik berbasis hardware, root path aplikasi, dan environment server.
     */
    public function getInstallId(): string
    {
        $machineFactors = [
            php_uname('n'),                         // Hostname
            $_SERVER['SERVER_ADDR'] ?? '127.0.0.1', // Server IP
            $_SERVER['DOCUMENT_ROOT'] ?? '',        // Web root
            dirname($this->storagePath),             // Root aplikasi
            PHP_OS,
        ];

        if (file_exists('/etc/machine-id')) {
            $machineFactors[] = trim(@file_get_contents('/etc/machine-id'));
        }

        $raw = implode('||', $machineFactors);
        return hash('sha256', $raw);
    }

    /**
     * Generate fingerprint untuk platform hosting/server.
     */
    public function getFingerprint(): string
    {
        $domain = $this->getDomain();
        $username = get_current_user();
        return hash('sha256', $domain . '|' . $username);
    }

    /**
     * Deteksi nama domain saat ini.
     */
    public function getDomain(): string
    {
        $host = $_SERVER['HTTP_HOST'] ?? ($_SERVER['SERVER_NAME'] ?? 'localhost');
        return preg_replace('/:\d+$/', '', trim($host));
    }

    /**
     * Ambil informasi detail lisensi asli dari License Manager server.
     */
    public function getLicenseInfo(string $licenseKey): ?array
    {
        $res = $this->request('GET', '/api/v1/license/' . urlencode(trim($licenseKey)));
        if (($res['status'] ?? '') === 'success' && isset($res['data'])) {
            return $res['data'];
        }
        return null;
    }

    /**
     * Normalisasi nilai masa berlaku lisensi.
     * Mengembalikan null jika lisensi tidak memiliki tanggal kedaluwarsa (unlimited / seumur hidup).
     */
    public function normalizeExpiresAt(?string $expiresAt): ?string
    {
        if (empty($expiresAt)) {
            return null;
        }

        $trimmed = trim($expiresAt);
        if (
            $trimmed === '' ||
            strtolower($trimmed) === 'null' ||
            str_starts_with($trimmed, '0000-00-00') ||
            strtolower($trimmed) === 'lifetime' ||
            strtolower($trimmed) === 'unlimited' ||
            strtolower($trimmed) === 'seumur hidup'
        ) {
            return null;
        }

        $ts = strtotime($trimmed);
        if ($ts === false || $ts <= 0) {
            return null;
        }

        return $trimmed;
    }

    /**
     * Verifikasi lisensi ke server pusat.
     */
    public function verifyWithServer(string $licenseKey): array
    {
        $payload = [
            'license_key' => $licenseKey,
            'fingerprint' => $this->getFingerprint(),
            'platform' => 'hosting',
            'domain' => $this->getDomain(),
            'device_info' => [
                'install_id' => $this->getInstallId(),
                'hostname' => php_uname('n'),
                'os' => PHP_OS,
                'php_version' => PHP_VERSION,
                'app_root' => dirname($this->storagePath),
            ],
        ];

        $res = $this->request('POST', '/api/v1/verify', $payload);

        if (($res['status'] ?? '') === 'success') {
            $tokenExpiresAt = $res['data']['expires_at'] ?? null;
            $res['data']['token_expires_at'] = $tokenExpiresAt;

            // Sinkronkan masa berlaku lisensi yang sebenarnya dari License Manager
            $detail = $this->getLicenseInfo($licenseKey);
            if ($detail !== null) {
                // Jika di server pusat expires_at null/kosong, berarti lisensi unlimited (seumur hidup)
                $res['data']['expires_at'] = $this->normalizeExpiresAt($detail['expires_at'] ?? null);
            } elseif (isset($res['data']['license']) && is_array($res['data']['license'])) {
                $res['data']['expires_at'] = $this->normalizeExpiresAt($res['data']['license']['expires_at'] ?? null);
            } else {
                // JANGAN gunakan token JWT expiry 24 jam ($tokenExpiresAt) sebagai masa berlaku lisensi
                $res['data']['expires_at'] = null;
            }
        }

        return $res;
    }

    /**
     * Aktivasi lisensi baru ke server pusat.
     */
    public function activateLicense(string $licenseKey): array
    {
        $payload = [
            'license_key' => trim($licenseKey),
            'fingerprint' => $this->getFingerprint(),
            'platform' => 'hosting',
            'domain' => $this->getDomain(),
            'device_info' => [
                'install_id' => $this->getInstallId(),
                'hostname' => php_uname('n'),
                'os' => PHP_OS,
                'php_version' => PHP_VERSION,
                'app_root' => dirname($this->storagePath),
            ],
        ];

        $res = $this->request('POST', '/api/v1/activate', $payload);

        if (($res['status'] ?? '') === 'success') {
            $tokenExpiresAt = $res['data']['expires_at'] ?? null;

            // Ambil masa berlaku lisensi yang sebenarnya dari License Manager
            $detail = $this->getLicenseInfo($licenseKey);
            if ($detail !== null) {
                // Jika di server pusat tidak diset tanggal (null/kosong), lisensi bersifat unlimited (seumur hidup)
                $realExpiresAt = $this->normalizeExpiresAt($detail['expires_at'] ?? null);
            } elseif (isset($res['data']['license']) && is_array($res['data']['license'])) {
                $realExpiresAt = $this->normalizeExpiresAt($res['data']['license']['expires_at'] ?? null);
            } else {
                // JANGAN gunakan token JWT expiry 24 jam ($tokenExpiresAt) sebagai masa berlaku lisensi
                $realExpiresAt = null;
            }

            $saveData = [
                'license_key' => trim($licenseKey),
                'token' => $res['data']['token'] ?? null,
                'token_expires_at' => $tokenExpiresAt,
                'expires_at' => $realExpiresAt,
                'install_id' => $this->getInstallId(),
                'domain' => $this->getDomain(),
                'last_checked' => time(),
            ];
            $this->writeStorageData($saveData);

            $res['data']['token_expires_at'] = $tokenExpiresAt;
            $res['data']['expires_at'] = $realExpiresAt;
        }

        return $res;
    }

    /**
     * Cabut / Deaktivasi lisensi secara sah agar bisa dipindahkan ke server baru.
     */
    public function revokeLicense(): array
    {
        $data = $this->readStorageData();
        $licenseKey = $data['license_key'] ?? '';

        if (empty($licenseKey)) {
            return ['status' => 'error', 'message' => 'Tidak ada lisensi aktif yang dapat dicabut.'];
        }

        $payload = [
            'license_key' => $licenseKey,
            'fingerprint' => $this->getFingerprint(),
            'platform' => 'hosting',
            'device_info' => [
                'install_id' => $this->getInstallId(),
            ],
        ];

        $res = $this->request('POST', '/api/v1/deactivate', $payload);

        // Hapus file signature terenkripsi lokal
        $this->deleteStorageData();

        return $res;
    }

    /**
     * Proteksi aplikasi (Lock screen jika lisensi tidak sah).
     */
    public function protect(): bool
    {
        $this->handleFormSubmission();

        $data = $this->readStorageData();
        if (empty($data) || empty($data['license_key'])) {
            $this->lockApplication('Aplikasi belum terdaftar. Silakan masukkan Lisensi Resmi Anda.');
        }

        $licenseKey = $data['license_key'];
        $currentInstallId = $this->getInstallId();

        if (!empty($data['install_id']) && $data['install_id'] !== $currentInstallId) {
            $this->lockApplication(
                'Aplikasi telah dipindahkan secara tidak sah ke server/folder baru!<br>' .
                'Silakan cabut lisensi dari server sebelumnya atau hubungi administrator untuk transfer lisensi.'
            );
        }

        $lastChecked = $data['last_checked'] ?? 0;
        $now = time();
        $checkInterval = 6 * 3600;

        if (($now - $lastChecked) > $checkInterval) {
            $verifyResult = $this->verifyWithServer($licenseKey);

            if (($verifyResult['status'] ?? '') === 'success') {
                $data['token'] = $verifyResult['data']['token'] ?? ($data['token'] ?? null);
                $data['token_expires_at'] = $verifyResult['data']['token_expires_at'] ?? ($data['token_expires_at'] ?? null);
                $data['expires_at'] = $this->normalizeExpiresAt($verifyResult['data']['expires_at'] ?? null);
                $data['last_checked'] = $now;
                $data['install_id'] = $currentInstallId;
                $this->writeStorageData($data);
            } else {
                $isConnectionError = isset($verifyResult['is_offline']) && $verifyResult['is_offline'];
                if ($isConnectionError) {
                    $graceExpiry = $lastChecked + ($this->gracePeriodHours * 3600);
                    if ($now > $graceExpiry) {
                        $this->lockApplication(
                            'Gagal terhubung ke server lisensi dan masa tenggang offline (' . $this->gracePeriodHours . ' jam) telah habis.'
                        );
                    }
                } else {
                    $errorMsg = $verifyResult['message'] ?? 'Lisensi tidak sah atau telah dinonaktifkan.';
                    $this->lockApplication($errorMsg);
                }
            }
        }

        return true;
    }

    /**
     * Menangani interaksi POST di Lock Screen
     */
    protected function handleFormSubmission(): void
    {
        if (isset($_POST['_guard_action'])) {
            $action = $_POST['_guard_action'];

            if ($action === 'activate' && !empty($_POST['license_key'])) {
                $res = $this->activateLicense($_POST['license_key']);
                if (($res['status'] ?? '') === 'success') {
                    header('Location: ' . ($_SERVER['REQUEST_URI'] ?? '/'));
                    exit;
                } else {
                    $this->lockApplication('Aktivasi Gagal: ' . ($res['message'] ?? 'Kunci lisensi tidak valid.'));
                }
            }

            if ($action === 'revoke') {
                $res = $this->revokeLicense();
                $msg = (($res['status'] ?? '') === 'success')
                    ? 'Lisensi berhasil dicabut! Anda sekarang dapat menggunakannya di server lain.'
                    : 'Gagal mencabut: ' . ($res['message'] ?? 'Terjadi kesalahan.');
                $this->lockApplication($msg);
            }
        }
    }

    /**
     * HTTP Request ke License Server
     */
    protected function request(string $method, string $endpoint, array $data = []): array
    {
        $url = $this->serverUrl . $endpoint;
        $headers = [
            'X-API-Key: ' . $this->apiKey,
            'X-Install-Id: ' . $this->getInstallId(),
            'Content-Type: application/json',
            'Accept: application/json',
        ];

        $ch = curl_init();
        if ($method === 'GET') {
            $url .= '?' . http_build_query($data);
            curl_setopt($ch, CURLOPT_HTTPGET, true);
        } else {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_TIMEOUT, 12);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            return [
                'status' => 'error',
                'is_offline' => true,
                'message' => 'Gagal menghubungi server lisensi: ' . $error,
            ];
        }

        $decoded = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return [
                'status' => 'error',
                'is_offline' => false,
                'message' => 'Respon server tidak valid (HTTP ' . $httpCode . '): ' . substr($response, 0, 150),
            ];
        }

        return $decoded;
    }

    /**
     * Tampilkan Lock Screen dan hentikan proses.
     */
    protected function lockApplication(string $reason): void
    {
        $domain = htmlspecialchars($this->getDomain(), ENT_QUOTES, 'UTF-8');
        $installId = htmlspecialchars($this->getInstallId(), ENT_QUOTES, 'UTF-8');
        $installIdShort = substr($installId, 0, 12) . '...' . substr($installId, -8);
        $hasLocalLicense = !empty($this->readStorageData()['license_key'] ?? '');

        if (!headers_sent()) {
            http_response_code(403);
            header('Content-Type: text/html; charset=UTF-8');
        }

        echo <<<HTML
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Akses Terkunci - Lisensi Diperlukan</title>
    <style>
        :root {
            --primary: #4f46e5;
            --danger: #dc2626;
            --bg: #0f172a;
            --card-bg: #1e293b;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --border: #334155;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        body { background: var(--bg); color: var(--text-main); display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
        .lock-container { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; max-width: 480px; width: 100%; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); text-align: center; }
        .icon-badge { width: 56px; height: 56px; background: rgba(220,38,38,0.15); border: 1px solid var(--danger); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: var(--danger); font-size: 24px; }
        h1 { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
        .reason-box { background: rgba(0,0,0,0.25); border-left: 4px solid var(--danger); padding: 12px; margin: 16px 0; border-radius: 4px; text-align: left; font-size: 13px; color: #fca5a5; line-height: 1.5; }
        .info-grid { background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 6px; padding: 12px; margin-bottom: 20px; font-size: 12px; text-align: left; display: grid; grid-template-columns: 80px 1fr; gap: 6px; color: var(--text-muted); }
        .info-grid .val { color: var(--text-main); font-family: monospace; }
        form { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; text-align: left; }
        label { font-size: 12px; font-weight: 600; color: var(--text-muted); }
        input[type="text"] { background: #0f172a; border: 1px solid var(--border); border-radius: 6px; padding: 10px 14px; color: var(--text-main); font-size: 14px; font-family: monospace; outline: none; }
        input[type="text"]:focus { border-color: var(--primary); }
        button { border: none; border-radius: 6px; padding: 10px 16px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
        .btn-primary { background: var(--primary); color: #fff; }
        .btn-primary:hover { background: #4338ca; }
        .btn-danger { background: transparent; border: 1px solid var(--border); color: #f87171; }
        .btn-danger:hover { background: rgba(220,38,38,0.1); border-color: var(--danger); }
        .revoke-section { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border); }
    </style>
</head>
<body>
    <div class="lock-container">
        <div class="icon-badge">🔒</div>
        <h1>Akses Aplikasi Terkunci</h1>
        <p style="color: var(--text-muted); font-size: 13px;">Sistem mendeteksi lisensi belum terverifikasi atau tidak sah.</p>
        
        <div class="reason-box">{$reason}</div>

        <div class="info-grid">
            <span>Domain:</span>
            <span class="val">{$domain}</span>
            <span>Install ID:</span>
            <span class="val">{$installIdShort}</span>
        </div>

        <form method="POST">
            <input type="hidden" name="_guard_action" value="activate">
            <label for="license_key">Masukkan Kunci Lisensi:</label>
            <input type="text" id="license_key" name="license_key" placeholder="Contoh: PROD-XXXX-XXXX-XXXX" required autofocus>
            <button type="submit" class="btn-primary">Aktivasi Aplikasi</button>
        </form>
HTML;

        if ($hasLocalLicense) {
            echo <<<HTML
        <div class="revoke-section">
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 10px;">Ingin memindahkan lisensi ke server lain?</p>
            <form method="POST" onsubmit="return confirm('Apakah Anda yakin ingin mencabut lisensi dari server ini?');">
                <input type="hidden" name="_guard_action" value="revoke">
                <button type="submit" class="btn-danger">Cabut Lisensi dari Server Ini</button>
            </form>
        </div>
HTML;
        }

        echo <<<HTML
    </div>
</body>
</html>
HTML;
        exit(1);
    }
}
