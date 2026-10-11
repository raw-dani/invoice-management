<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function show(): JsonResponse
    {
        $user = auth()->user();
        if ($user->company_id && !$user->relationLoaded('company')) {
            $user->load('company');
        }

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'company_id' => $user->company_id,
                'company' => $user->company ? [
                    'id' => $user->company->id,
                    'name' => $user->company->name,
                ] : null,
                'created_at' => $user->created_at,
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = auth()->user();

        if ($user->role === 'demo') {
            return response()->json([
                'message' => 'Akun peran demo hanya memiliki hak View Only dan tidak dapat mengubah profil.',
            ], 403);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
        ]);

        $user->update($data);
        if ($user->company_id) {
            $user->load('company');
        }

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'company_id' => $user->company_id,
                'company' => $user->company ? [
                    'id' => $user->company->id,
                    'name' => $user->company->name,
                ] : null,
                'created_at' => $user->created_at,
            ],
            'message' => 'Profil berhasil diperbarui.',
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $user = auth()->user();

        if ($user->role === 'demo') {
            return response()->json([
                'message' => 'Akun peran demo tidak diperbolehkan mengganti kata sandi.',
            ], 403);
        }

        $data = $request->validate([
            'current_password' => ['required', 'string', function ($attribute, $value, $fail) use ($user) {
                if (!Hash::check($value, $user->password)) {
                    $fail('Password saat ini salah (Current password is incorrect).');
                }
            }],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'current_password.required' => 'Password saat ini wajib diisi.',
            'password.required' => 'Password baru wajib diisi.',
            'password.min' => 'Password baru minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi password baru tidak cocok.',
        ]);

        $user->update(['password' => Hash::make($data['password'])]);

        return response()->json(['message' => 'Password berhasil diubah.']);
    }
}
