<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\ActivityLog;
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

    public function store(StoreUserRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = User::create([
            ...$data,
            'password' => Hash::make($data['password']),
            'company_id' => auth()->user()->company_id,
        ]);

        ActivityLog::record('user.created', "User {$user->name} created", $user);

        return response()->json(['data' => $user->only(['id', 'name', 'email', 'role', 'created_at'])], 201);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $this->authorize('manage', $user);

        $data = $request->validated();
        $user->update($data);

        ActivityLog::record('user.updated', "User {$user->name} updated", $user);

        return response()->json(['data' => $user->fresh()->only(['id', 'name', 'email', 'role', 'created_at'])]);
    }

    public function destroy(User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        abort_if($user->id === auth()->id(), 422, 'You cannot delete your own account.');
        abort_if($user->role === 'owner', 422, 'The company owner cannot be deleted.');

        $user->delete();

        ActivityLog::record('user.deleted', "User {$user->name} deleted", $user);

        return response()->json(['message' => 'User deleted successfully.']);
    }

    public function assignRole(Request $request, User $user): JsonResponse
    {
        $this->authorize('manage', $user);

        $user->update($request->validate(['role' => 'required|in:admin,staff,viewer,demo']));

        ActivityLog::record('user.role_updated', "User {$user->name} role updated to {$user->role}", $user);

        return response()->json(['data' => $user->fresh()->only(['id', 'name', 'email', 'role'])]);
    }
}
