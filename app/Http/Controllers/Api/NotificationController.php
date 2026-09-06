<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Notification::where('company_id', auth()->user()->company_id)
            ->where('user_id', auth()->id())->latest();

        if ($request->boolean('unread')) $query->whereNull('read_at');

        return response()->json([
            'data' => $query->paginate(min((int) $request->input('per_page', 20), 100)),
            'unread_count' => Notification::where('company_id', auth()->user()->company_id)->where('user_id', auth()->id())->whereNull('read_at')->count(),
        ]);
    }

    public function read(Notification $notification): JsonResponse
    {
        $this->authorizeNotification($notification);
        $notification->update(['read_at' => now()]);

        return response()->json(['message' => 'Notification marked as read.']);
    }

    public function readAll(): JsonResponse
    {
        Notification::where('company_id', auth()->user()->company_id)->where('user_id', auth()->id())->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }

    private function authorizeNotification(Notification $notification): void
    {
        abort_unless($notification->company_id === auth()->user()->company_id && $notification->user_id === auth()->id(), 403);
    }
}