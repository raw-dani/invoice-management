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

        return response()->json(['data' => $user->only(['id', 'name', 'email', 'role', 'company_id', 'created_at'])]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = auth()->user();

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
        ]);

        $user->update($data);

        return response()->json(['data' => $user->fresh()->only(['id', 'name', 'email', 'role', 'company_id', 'created_at']), 'message' => 'Profile updated successfully.']);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $user = auth()->user();

        $data = $request->validate([
            'current_password' => ['required', 'string', function ($attribute, $value, $fail) use ($user) {
                if (!Hash::check($value, $user->password)) {
                    $fail('The current password is incorrect.');
                }
            }],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user->update(['password' => Hash::make($data['password'])]);

        return response()->json(['message' => 'Password changed successfully.']);
    }
}
