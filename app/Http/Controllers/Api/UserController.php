<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => User::where('company_id', auth()->user()->company_id)->latest()->get(['id', 'name', 'email', 'role', 'created_at'])]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['name' => 'required|string|max:255', 'email' => 'required|email|unique:users,email', 'password' => 'required|string|min:8|confirmed', 'role' => 'required|in:admin,staff,viewer']);
        $user = User::create([...$data, 'password' => Hash::make($data['password']), 'company_id' => auth()->user()->company_id]);

        return response()->json(['data' => $user->only(['id', 'name', 'email', 'role', 'created_at'])], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->authorizeUser($user);
        $data = $request->validate(['name' => 'required|string|max:255', 'email' => 'required|email|unique:users,email,' . $user->id, 'role' => 'required|in:admin,staff,viewer']);
        $user->update($data);

        return response()->json(['data' => $user->fresh()->only(['id', 'name', 'email', 'role', 'created_at'])]);
    }

    public function destroy(User $user): JsonResponse
    {
        $this->authorizeUser($user);
        abort_if($user->id === auth()->id(), 422, 'You cannot delete your own account.');
        abort_if($user->role === 'owner', 422, 'The company owner cannot be deleted.');
        $user->delete();

        return response()->json(['message' => 'User deleted successfully.']);
    }

    public function assignRole(Request $request, User $user): JsonResponse
    {
        $this->authorizeUser($user);
        $user->update($request->validate(['role' => 'required|in:admin,staff,viewer']) );

        return response()->json(['data' => $user->fresh()->only(['id', 'name', 'email', 'role'])]);
    }

    private function authorizeUser(User $user): void
    {
        abort_unless($user->company_id === auth()->user()->company_id, 403);
    }
}