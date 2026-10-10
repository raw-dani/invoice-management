<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class SettingsController extends Controller
{
    private const GROUPS = [
        'invoice' => ['prefix', 'due_days', 'currency', 'tax_rate'],
        'quote' => ['prefix', 'valid_days'],
        'email' => ['mailer', 'from_name', 'from_address', 'payment_reminders_enabled', 'reminder_due_soon_enabled', 'reminder_due_date_enabled', 'reminder_overdue_enabled', 'reminder_final_enabled'],
        'payment' => ['bank_name', 'account_name', 'account_number', 'instructions'],
    ];

    public function show(string $group): JsonResponse
    {
        if (in_array($group, ['demo_data', 'demo-data'])) {
            return $this->demoDataStats(app(\App\Services\DemoDataService::class));
        }

        $this->validateGroup($group);
        $companyId = auth()->user()->company_id;

        if ($group === 'company') {
            return response()->json(['data' => Company::findOrFail($companyId)]);
        }

        $keys = self::GROUPS[$group];
        $values = Setting::where('company_id', $companyId)
            ->whereIn('key', $keys)
            ->pluck('value', 'key');

        return response()->json(['data' => collect($keys)->mapWithKeys(fn ($key) => [$key => $values[$key] ?? null])]);
    }

    public function update(Request $request, string $group): JsonResponse
    {
        if (in_array($group, ['demo_data', 'demo-data'])) {
            return response()->json(['message' => 'Demo data settings cannot be updated via PUT.']);
        }

        $this->validateGroup($group);
        $companyId = auth()->user()->company_id;

        if ($group === 'company') {
            $company = Company::findOrFail($companyId);
            $company->update($request->validate([
                'name' => 'required|string|max:255',
                'logo' => 'nullable|string|max:2048',
                'signature' => 'nullable|string|max:2048',
                'stamp' => 'nullable|string|max:2048',
                'qris' => 'nullable|string|max:2048',
                'address' => 'nullable|string',
                'city' => 'nullable|string|max:100',
                'province' => 'nullable|string|max:100',
                'country' => 'nullable|string|max:100',
                'phone' => 'nullable|string|max:50',
                'email' => 'nullable|email|max:255',
                'website' => 'nullable|url|max:255',
                'tax_number' => 'nullable|string|max:100',
                'authorized_signer_name' => 'nullable|string|max:255',
                'authorized_signer_title' => 'nullable|string|max:255',
                'show_signature_on_pdf' => 'nullable|boolean',
                'show_stamp_on_pdf' => 'nullable|boolean',
                'show_qris_on_pdf' => 'nullable|boolean',
                'show_paid_watermark' => 'nullable|boolean',
            ]));

            return response()->json(['data' => $company->fresh(), 'message' => 'Company settings updated.']);
        }

        $data = $request->validate(array_fill_keys(self::GROUPS[$group], 'nullable|string|max:10000'));
        foreach ($data as $key => $value) Setting::setValue($companyId, $key, $value);

        return $this->show($group)->setData(['data' => $data, 'message' => ucfirst($group) . ' settings updated.']);
    }

    public function testEmail(Request $request): JsonResponse
    {
        $data = $request->validate(['to' => 'required|email']);
        $company = Company::findOrFail(auth()->user()->company_id);

        try {
            Mail::raw('This is a test email from Invoice Management.', function ($message) use ($data, $company) {
                $message->to($data['to'])->subject('Invoice Management test email')->from($company->email ?? config('mail.from.address'), $company->name);
            });
        } catch (\Throwable $exception) {
            return response()->json(['message' => 'Test email failed.', 'error' => $exception->getMessage()], 422);
        }

        return response()->json(['message' => 'Test email sent successfully.']);
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate([
            'logo' => ['required', 'image', 'max:2048'],
        ]);

        $company = Company::findOrFail(auth()->user()->company_id);

        if ($company->logo && Storage::disk('public')->exists($company->logo)) {
            Storage::disk('public')->delete($company->logo);
        }

        $path = $request->file('logo')->store('company-logos', 'public');
        $company->update(['logo' => $path]);

        return response()->json([
            'data' => ['logo' => asset('storage/' . $path)],
            'message' => 'Logo uploaded successfully.',
        ]);
    }

    public function uploadSignature(Request $request): JsonResponse
    {
        $request->validate([
            'signature' => ['required', 'image', 'max:2048'],
        ]);

        $company = Company::findOrFail(auth()->user()->company_id);

        if ($company->signature && Storage::disk('public')->exists($company->signature)) {
            Storage::disk('public')->delete($company->signature);
        }

        $path = $request->file('signature')->store('company-signatures', 'public');
        $company->update(['signature' => $path]);

        return response()->json([
            'data' => ['signature' => asset('storage/' . $path)],
            'message' => 'Tanda tangan berhasil diunggah.',
        ]);
    }

    public function uploadStamp(Request $request): JsonResponse
    {
        $request->validate([
            'stamp' => ['required', 'image', 'max:2048'],
        ]);

        $company = Company::findOrFail(auth()->user()->company_id);

        if ($company->stamp && Storage::disk('public')->exists($company->stamp)) {
            Storage::disk('public')->delete($company->stamp);
        }

        $path = $request->file('stamp')->store('company-stamps', 'public');
        $company->update(['stamp' => $path]);

        return response()->json([
            'data' => ['stamp' => asset('storage/' . $path)],
            'message' => 'Stempel perusahaan berhasil diunggah.',
        ]);
    }

    public function uploadQris(Request $request): JsonResponse
    {
        $request->validate([
            'qris' => ['required', 'image', 'max:2048'],
        ]);

        $company = Company::findOrFail(auth()->user()->company_id);

        if ($company->qris && Storage::disk('public')->exists($company->qris)) {
            Storage::disk('public')->delete($company->qris);
        }

        $path = $request->file('qris')->store('company-qris', 'public');
        $company->update(['qris' => $path]);

        return response()->json([
            'data' => ['qris' => asset('storage/' . $path)],
            'message' => 'Gambar QRIS berhasil diunggah.',
        ]);
    }

    public function demoDataStats(\App\Services\DemoDataService $service): JsonResponse
    {
        abort_unless(in_array(auth()->user()->role, ['owner', 'admin', 'demo']), 403, 'Unauthorized action.');
        $company = Company::findOrFail(auth()->user()->company_id);

        return response()->json([
            'data' => $service->stats($company),
        ]);
    }

    public function generateDemoData(\App\Services\DemoDataService $service): JsonResponse
    {
        $this->ensureAdminUser();
        $company = Company::findOrFail(auth()->user()->company_id);

        $stats = $service->generate($company, auth()->user());

        return response()->json([
            'message' => 'Data demo berhasil dimuat lengkap.',
            'data' => $stats,
        ]);
    }

    public function clearDemoData(\App\Services\DemoDataService $service): JsonResponse
    {
        $this->ensureAdminUser();
        $company = Company::findOrFail(auth()->user()->company_id);

        $deleted = $service->clear($company);

        return response()->json([
            'message' => 'Data demo berhasil dihapus dari sistem.',
            'deleted' => $deleted,
        ]);
    }

    private function ensureAdminUser(): void
    {
        abort_unless(in_array(auth()->user()->role, ['owner', 'admin']), 403, 'Hanya admin yang memiliki izin untuk mengelola atau menghapus data demo.');
    }

    private function validateGroup(string $group): void
    {
        abort_unless($group === 'company' || array_key_exists($group, self::GROUPS), 404, 'Unknown settings group.');
    }
}