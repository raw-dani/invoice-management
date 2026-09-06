<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityLogResource;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ActivityLogController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = ActivityLog::with('user')
            ->where('company_id', auth()->user()->company_id)
            ->latest();

        if ($request->filled('action')) $query->where('action', $request->string('action'));
        if ($request->filled('subject_type')) $query->where('subject_type', 'like', '%' . $request->string('subject_type') . '%');
        if ($request->filled('user_id')) $query->where('user_id', $request->integer('user_id'));
        if ($request->filled('from')) $query->whereDate('created_at', '>=', $request->date('from'));
        if ($request->filled('to')) $query->whereDate('created_at', '<=', $request->date('to'));

        return ActivityLogResource::collection($query->paginate(min((int) $request->input('per_page', 25), 100)));
    }
}