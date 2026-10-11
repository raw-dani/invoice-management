<?php

namespace App\Http\Middleware;

use App\Services\LicenseService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureLicenseIsActive
{
    public function __construct(protected LicenseService $licenseService)
    {
    }

    /**
     * Handle an incoming request.
     * Pastikan lisensi aplikasi aktif sebelum mengizinkan akses ke modul operasional.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Bypass otomatis di environment testing unit testing
        if (app()->environment('testing') && !config('services.license.enforce_in_tests', false)) {
            return $next($request);
        }

        // Whitelist endpoint yang wajib bisa diakses saat lisensi belum aktif
        if ($this->shouldPassThrough($request)) {
            return $next($request);
        }

        $user = $request->user();
        if (!$user) {
            return $next($request);
        }

        $status = $this->licenseService->getStatus($user->company_id);

        if (empty($status['is_licensed'])) {
            return response()->json([
                'message' => 'Aplikasi belum aktif. Lisensi resmi diperlukan untuk mengakses modul operasional.',
                'license_status' => $status['status'] ?? 'unlicensed',
                'license_required' => true,
            ], 423); // 423 Locked
        }

        return $next($request);
    }

    /**
     * Cek apakah rute ini dikecualikan dari pemblokiran lisensi.
     */
    protected function shouldPassThrough(Request $request): bool
    {
        $whitelist = [
            'api/health',
            'api/auth/*',
            'api/saml/*',
            'api/public/*',
            'api/webhooks/*',
            'api/settings/license/*',
            'api/settings/license',
            'api/profile',
            'api/profile/*',
            'sanctum/csrf-cookie',
        ];

        foreach ($whitelist as $pattern) {
            if ($request->is($pattern)) {
                return true;
            }
        }

        // Izinkan GET settings untuk pembacaan konfigurasi UI
        if ($request->is('api/settings/*') && $request->isMethod('GET')) {
            return true;
        }

        return false;
    }
}
