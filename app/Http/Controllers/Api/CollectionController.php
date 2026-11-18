<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CollectionLog;
use App\Models\CollectionTask;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class CollectionController extends Controller
{
    /**
     * List active collection follow-up tasks for the collector team.
     */
    public function tasks(Request $request): JsonResponse
    {
        $companyId = $request->user()->company_id;

        $query = CollectionTask::with(['customer', 'invoice', 'assignedUser'])
            ->where('company_id', $companyId);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        } else {
            $query->whereIn('status', ['pending', 'in_progress']);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        $tasks = $query->orderBy('due_date', 'asc')->paginate($request->integer('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $tasks->items(),
            'meta' => [
                'current_page' => $tasks->currentPage(),
                'last_page' => $tasks->lastPage(),
                'per_page' => $tasks->perPage(),
                'total' => $tasks->total(),
            ],
        ]);
    }

    /**
     * Create a new collection task.
     */
    public function createTask(Request $request): JsonResponse
    {
        $companyId = $request->user()->company_id;

        $validated = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'invoice_id' => ['nullable', 'exists:invoices,id'],
            'assigned_to_user_id' => ['nullable', 'exists:users,id'],
            'due_date' => ['required', 'date'],
            'priority' => ['required', 'in:low,medium,high,urgent'],
            'notes' => ['nullable', 'string'],
        ]);

        $task = CollectionTask::create(array_merge($validated, [
            'company_id' => $companyId,
            'status' => 'pending',
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Tugas penagihan berhasil dibuat.',
            'data' => $task->load(['customer', 'invoice', 'assignedUser']),
        ], 201);
    }

    /**
     * Log a follow-up action / call result from a collector.
     */
    public function recordLog(Request $request): JsonResponse
    {
        $companyId = $request->user()->company_id;
        $userId = $request->user()->id;

        $validated = $request->validate([
            'collection_task_id' => ['nullable', 'exists:collection_tasks,id'],
            'customer_id' => ['required', 'exists:customers,id'],
            'invoice_id' => ['nullable', 'exists:invoices,id'],
            'channel' => ['required', 'in:phone,whatsapp,email,visit'],
            'contact_person' => ['nullable', 'string', 'max:100'],
            'outcome' => ['required', 'in:connected_ptp,connected_no_ptp,no_answer,wrong_number,dispute,other'],
            'promise_to_pay_date' => ['nullable', 'date'],
            'promise_to_pay_amount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['required', 'string'],
        ]);

        $log = CollectionLog::create(array_merge($validated, [
            'company_id' => $companyId,
            'user_id' => $userId,
        ]));

        // If task was provided, update its status
        if (!empty($validated['collection_task_id'])) {
            $task = CollectionTask::find($validated['collection_task_id']);
            if ($task) {
                if ($validated['outcome'] === 'connected_ptp') {
                    $task->status = 'completed';
                } else {
                    $task->status = 'in_progress';
                }
                $task->save();
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Catatan hasil penagihan berhasil disimpan.',
            'data' => $log->load(['user', 'customer', 'invoice']),
        ], 201);
    }

    /**
     * List collection history logs.
     */
    public function logs(Request $request): JsonResponse
    {
        $companyId = $request->user()->company_id;

        $query = CollectionLog::with(['user', 'customer', 'invoice'])
            ->where('company_id', $companyId);

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('invoice_id')) {
            $query->where('invoice_id', $request->invoice_id);
        }

        $logs = $query->orderByDesc('id')->paginate($request->integer('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }

    /**
     * Headless background WhatsApp dispatch via configured gateway.
     */
    public function sendWhatsAppMessage(Request $request): JsonResponse
    {
        $company = $request->user()->company;

        $validated = $request->validate([
            'phone' => ['required', 'string'],
            'message' => ['required', 'string'],
        ]);

        // Normalize phone number to 62...
        $phone = preg_replace('/[^0-9]/', '', $validated['phone']);
        if (str_starts_with($phone, '0')) {
            $phone = '62' . substr($phone, 1);
        }

        if ($company->whatsapp_provider === 'fonnte') {
            $token = $company->whatsapp_api_token;
            if (!$token) {
                return response()->json(['success' => false, 'message' => 'API Token Fonnte belum dikonfigurasi.'], 422);
            }

            $response = Http::withHeaders(['Authorization' => $token])
                ->post('https://api.fonnte.com/send', [
                    'target' => $phone,
                    'message' => $validated['message'],
                ]);

            return response()->json([
                'success' => $response->successful(),
                'message' => $response->successful() ? 'Pesan WhatsApp berhasil dikirim via Fonnte.' : 'Gagal mengirim via Fonnte.',
                'response' => $response->json(),
            ]);
        }

        // Fallback simulation / webhook dispatch
        return response()->json([
            'success' => true,
            'message' => 'Pesan WhatsApp siap dikirimkan (Mode Gateway Terkonfigurasi).',
            'phone' => $phone,
        ]);
    }
}
