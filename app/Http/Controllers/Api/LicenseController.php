<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\LicenseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LicenseController extends Controller
{
    public function __construct(protected LicenseService $licenseService)
    {
    }

    /**
     * Get current license and hardware status.
     */
    public function status(Request $request): JsonResponse
    {
        $companyId = auth()->user()->company_id;
        $status = $this->licenseService->getStatus($companyId);

        return response()->json(['data' => $status]);
    }

    /**
     * Activate a license key on the license server.
     */
    public function activate(Request $request): JsonResponse
    {
        $request->validate([
            'license_key' => 'required|string|max:255',
            'server_url' => 'nullable|url|max:255',
            'api_key' => 'nullable|string|max:255',
        ]);

        $companyId = auth()->user()->company_id;
        $res = $this->licenseService->activate(
            $companyId,
            $request->input('license_key'),
            $request->input('server_url'),
            $request->input('api_key')
        );

        if (($res['status'] ?? '') === 'success') {
            return response()->json([
                'message' => $res['message'] ?? 'Lisensi berhasil diaktivasi.',
                'data' => $this->licenseService->getStatus($companyId),
            ]);
        }

        return response()->json([
            'message' => $res['message'] ?? 'Aktivasi lisensi gagal.',
            'error' => $res,
        ], 422);
    }

    /**
     * Re-verify license with the license server.
     */
    public function verify(Request $request): JsonResponse
    {
        $companyId = auth()->user()->company_id;
        $res = $this->licenseService->verify($companyId);

        if (($res['status'] ?? '') === 'success') {
            return response()->json([
                'message' => $res['message'] ?? 'Lisensi valid dan terverifikasi.',
                'data' => $this->licenseService->getStatus($companyId),
            ]);
        }

        return response()->json([
            'message' => $res['message'] ?? 'Gagal memverifikasi lisensi.',
            'error' => $res,
        ], 422);
    }

    /**
     * Revoke / deactivate the license.
     */
    public function revoke(Request $request): JsonResponse
    {
        $companyId = auth()->user()->company_id;
        $res = $this->licenseService->revoke($companyId);

        return response()->json([
            'message' => $res['message'] ?? 'Lisensi berhasil dicabut dari server ini.',
            'data' => $this->licenseService->getStatus($companyId),
        ]);
    }
}
