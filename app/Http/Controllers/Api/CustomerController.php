<?php

namespace App\Http\Controllers\Api;

use App\Policies\CustomerPolicy;
use Illuminate\Support\Facades\Gate;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCustomerRequest;
use App\Http\Requests\UpdateCustomerRequest;
use App\Http\Requests\ConvertCustomerSubscriptionRequest;
use App\Http\Resources\CustomerResource;
use App\Models\ActivityLog;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Quote;
use App\Models\Subscription;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CustomerController extends Controller
{
    private function authorizeCompany(Customer $customer): void
    {
        if ($customer->company_id !== auth()->user()->company_id) {
            abort(403, 'Unauthorized action.');
        }
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Customer::where('company_id', auth()->user()->company_id);

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('company_name', 'like', "%{$search}%")
                  ->orWhere('contact_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('customer_number', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $perPage = min((int) $request->input('per_page', 15), 100);

        $customers = $query->latest()->paginate($perPage);

        return CustomerResource::collection($customers);
    }

    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $this->authorize('create', Customer::class);

        $customer = Customer::create([
            ...$request->validated(),
            'company_id'      => auth()->user()->company_id,
            'customer_number' => Customer::generateCustomerNumber(auth()->user()->company_id),
        ]);

        return (new CustomerResource($customer))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Customer $customer): CustomerResource
    {
        $this->authorize('view', $customer);

        return new CustomerResource($customer);
    }

    /**
     * Aggregated related data for the customer detail page
     * (invoices, quotes, subscriptions, payments, activity).
     */
    public function overview(Customer $customer): JsonResponse
    {
        $this->authorize('view', $customer);

        $invoices = $customer->invoices()->latest()->limit(10)->get();
        $quotes = $customer->quotes()->latest()->limit(10)->get();
        $subscriptions = $customer->subscriptions()->latest()->limit(10)->get();
        $payments = $customer->payments()->latest('payment_date')->limit(10)->get();

        // Activity: logs whose subject is the customer itself or any of its related records.
        $subjectIds = $invoices->pluck('id')
            ->merge($quotes->pluck('id'))
            ->merge($subscriptions->pluck('id'))
            ->merge($payments->pluck('id'));

        $activity = ActivityLog::where('company_id', $customer->company_id)
            ->where(function ($q) use ($customer, $subjectIds) {
                $q->where(function ($q2) use ($customer) {
                    $q2->where('subject_type', Customer::class)->where('subject_id', $customer->id);
                })->orWhere(function ($q2) use ($subjectIds) {
                    $q2->whereIn('subject_type', [Invoice::class, Quote::class, Payment::class, Subscription::class])
                        ->whereIn('subject_id', $subjectIds);
                });
            })
            ->latest()
            ->limit(20)
            ->get();

        return response()->json(['data' => [
            'invoices' => $invoices,
            'quotes' => $quotes,
            'subscriptions' => $subscriptions,
            'payments' => $payments,
            'activity' => $activity,
        ]]);
    }

    public function update(UpdateCustomerRequest $request, Customer $customer): CustomerResource
    {
        $this->authorize('manage', $customer);

        $customer->update($request->validated());

        return new CustomerResource($customer->fresh());
    }

    public function destroy(Customer $customer): JsonResponse
    {
        $this->authorize('delete', $customer);

        $customer->delete();

        return response()->json(['message' => 'Customer deleted successfully.']);
    }

    public function bulkStatus(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer',
            'status' => 'required|in:lead,active,inactive',
        ]);

        $companyId = auth()->user()->company_id;

        $ids = Customer::where('company_id', $companyId)->whereIn('id', $data['ids'])->pluck('id');

        $updated = Customer::whereIn('id', $ids)->update(['status' => $data['status']]);

        return response()->json([
            'message' => "{$updated} customer(s) updated.",
            'data' => ['updated' => $updated],
        ]);
    }

    public function convertToSubscription(ConvertCustomerSubscriptionRequest $request, Customer $customer): JsonResponse
    {
        $this->authorize('manage', $customer);
        $data = $request->validated();
        $subscription = DB::transaction(function () use ($data, $customer): Subscription {
            $subscription = Subscription::create([
                ...collect($data)->except('items')->toArray(),
                'company_id' => $customer->company_id,
                'customer_id' => $customer->id,
                'status' => 'active',
                'subscription_number' => Subscription::generateSubscriptionNumber($customer->company_id),
            ]);
            $subscription->items()->createMany($data['items']);
            return $subscription->load('customer', 'items.product');
        });

        return response()->json(['data' => $subscription, 'message' => 'Customer converted to subscription.'], 201);
    }
}
