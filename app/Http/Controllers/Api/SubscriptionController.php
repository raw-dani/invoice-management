<?php

namespace App\Http\Controllers\Api;

use App\Policies\SubscriptionPolicy;
use Illuminate\Support\Facades\Gate;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Http\Requests\StoreSubscriptionRequest;
use App\Http\Requests\UpdateSubscriptionRequest;
use App\Http\Resources\SubscriptionResource;
use App\Jobs\GenerateRecurringInvoice;
use App\Models\BillingSchedule;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class SubscriptionController extends Controller
{
    private function authorizeCompany(Subscription $subscription): void
    {
        if ($subscription->company_id !== auth()->user()->company_id) {
            abort(403, 'Unauthorized action.');
        }
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Subscription::with('customer')
            ->where('company_id', auth()->user()->company_id);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where('subscription_number', 'like', "%{$search}%");
        }

        return SubscriptionResource::collection(
            $query->latest()->paginate(min((int) $request->input('per_page', 15), 100))
        );
    }

    public function store(StoreSubscriptionRequest $request): JsonResponse
    {
        $this->authorize('create', Subscription::class);

        $data = $request->validated();
        $subscription = DB::transaction(function () use ($data): Subscription {
            $subscription = Subscription::create([
                ...collect($data)->except('items')->toArray(),
                'company_id' => auth()->user()->company_id,
                'subscription_number' => Subscription::generateSubscriptionNumber(auth()->user()->company_id),
            ]);

            $subscription->items()->createMany($data['items']);

            return $subscription->load('customer', 'items.product');
        });

        return (new SubscriptionResource($subscription))->response()->setStatusCode(201);
    }

    public function show(Subscription $subscription): SubscriptionResource
    {
        $this->authorize('view', $subscription);

        return new SubscriptionResource($subscription->load('customer', 'items.product', 'invoices'));
    }

    public function update(UpdateSubscriptionRequest $request, Subscription $subscription): SubscriptionResource|JsonResponse
    {
        $this->authorize('manage', $subscription);

        if ($subscription->status === 'cancelled') {
            return response()->json(['message' => 'Cancelled subscriptions cannot be edited.'], 422);
        }

        $data = $request->validated();
        DB::transaction(function () use ($subscription, $data): void {
            $subscription->update(collect($data)->except('items')->toArray());
            $subscription->items()->delete();
            $subscription->items()->createMany($data['items']);
        });

        return new SubscriptionResource($subscription->fresh()->load('customer', 'items.product', 'invoices'));
    }

    public function destroy(Subscription $subscription): JsonResponse
    {
        $this->authorize('delete', $subscription);

        if ($subscription->invoices()->exists()) {
            return response()->json(['message' => 'Subscriptions with invoices cannot be deleted.'], 422);
        }

        $subscription->delete();

        return response()->json(['message' => 'Subscription deleted successfully.']);
    }

    public function bulkAction(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer',
            'action' => 'required|in:pause,resume,cancel',
        ]);

        $companyId = auth()->user()->company_id;
        $subscriptions = Subscription::where('company_id', $companyId)->whereIn('id', $data['ids'])->get();

        $targets = ['pause' => 'paused', 'resume' => 'active', 'cancel' => 'cancelled'];
        $allowed = [
            'pause' => ['active'],
            'resume' => ['paused'],
            'cancel' => ['draft', 'active', 'paused'],
        ];

        $processed = 0;
        $failed = 0;
        foreach ($subscriptions as $subscription) {
            if (!in_array($subscription->status, $allowed[$data['action']], true)) {
                $failed++;
                continue;
            }

            $target = $targets[$data['action']];
            $subscription->update(['status' => $target]);
            ActivityLog::record("subscription.{$target}", "Subscription {$subscription->subscription_number} {$target}", $subscription, [
                'previous_status' => $subscription->getOriginal('status'),
            ]);
            $processed++;
        }

        return response()->json([
            'message' => "{$processed} subscription(s) processed.",
            'data' => ['processed' => $processed, 'failed' => $failed],
        ]);
    }

    public function pause(Subscription $subscription): SubscriptionResource
    {
        return $this->changeStatus($subscription, 'paused', ['active']);
    }

    public function resume(Subscription $subscription): SubscriptionResource
    {
        return $this->changeStatus($subscription, 'active', ['paused']);
    }

    public function cancel(Subscription $subscription): SubscriptionResource
    {
        return $this->changeStatus($subscription, 'cancelled', ['draft', 'active', 'paused']);
    }

    public function generateInvoice(Subscription $subscription): JsonResponse
    {
        $this->authorize('manage', $subscription);

        if ($subscription->status !== 'active') {
            return response()->json(['message' => 'Only active subscriptions can generate invoices.'], 422);
        }

        $schedule = BillingSchedule::firstOrCreate([
            'subscription_id' => $subscription->id,
            'billing_date' => $subscription->next_billing_date,
        ], [
            'company_id' => $subscription->company_id,
            'status' => 'pending',
        ]);

        GenerateRecurringInvoice::dispatchSync($schedule->id);

        return response()->json([
            'data' => $schedule->fresh()->load('invoice'),
            'message' => 'Recurring invoice generated successfully.',
        ]);
    }

    private function changeStatus(Subscription $subscription, string $status, array $allowed): SubscriptionResource
    {
        $this->authorize('manage', $subscription);

        if (!in_array($subscription->status, $allowed, true)) {
            abort(422, "Subscription cannot be changed from {$subscription->status}.");
        }

        $subscription->update(['status' => $status]);
        ActivityLog::record("subscription.{$status}", "Subscription {$subscription->subscription_number} {$status}", $subscription, [
            'previous_status' => $subscription->getOriginal('status'),
        ]);

        return new SubscriptionResource($subscription->fresh()->load('customer', 'items.product', 'invoices'));
    }
}