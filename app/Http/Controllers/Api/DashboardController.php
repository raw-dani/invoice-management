<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceResource;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Subscription;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $companyId = auth()->user()->company_id;
        [$from, $to] = $this->dateRange($request);

        $invoices = Invoice::where('company_id', $companyId)
            ->whereBetween('invoice_date', [$from, $to]);

        return response()->json([
            'data' => [
                'total_revenue' => (float) (clone $invoices)
                    ->where('status', 'paid')
                    ->sum('paid_amount'),
                'outstanding' => (float) (clone $invoices)
                    ->whereIn('status', ['sent', 'partially_paid', 'overdue'])
                    ->sum('balance'),
                'overdue_count' => $this->overdueQuery($companyId, $from, $to)->count(),
                'customers_count' => Customer::where('company_id', $companyId)
                    ->whereBetween('created_at', [$from, $to])
                    ->count(),
                'mrr' => $this->monthlyRecurringRevenue(
                    Subscription::with('items')->where('company_id', $companyId)->where('status', 'active')->get()
                ),
            ],
        ]);
    }

    public function recentInvoices(Request $request): JsonResponse
    {
        [$from, $to] = $this->dateRange($request);

        $invoices = Invoice::with('customer')
            ->where('company_id', auth()->user()->company_id)
            ->whereBetween('invoice_date', [$from, $to])
            ->latest()
            ->limit(5)
            ->get();

        return response()->json([
            'data' => InvoiceResource::collection($invoices)->resolve(),
        ]);
    }

    public function overdueInvoices(Request $request): JsonResponse
    {
        [$from, $to] = $this->dateRange($request);

        $invoices = $this->overdueQuery(auth()->user()->company_id, $from, $to)
            ->with('customer')
            ->orderBy('due_date')
            ->limit(10)
            ->get();

        return response()->json([
            'data' => InvoiceResource::collection($invoices)->resolve(),
        ]);
    }

    public function upcomingBilling(Request $request): JsonResponse
    {
        [$from, $to] = $this->dateRange($request, 30);

        $subscriptions = Subscription::with('customer', 'items')
            ->where('company_id', auth()->user()->company_id)
            ->where('status', 'active')
            ->whereBetween('next_billing_date', [$from, $to])
            ->orderBy('next_billing_date')
            ->limit(10)
            ->get()
            ->map(fn (Subscription $subscription) => [
                'id' => $subscription->id,
                'subscription_number' => $subscription->subscription_number,
                'customer' => $subscription->customer?->company_name,
                'next_billing_date' => $subscription->next_billing_date?->toDateString(),
                'billing_cycle' => $subscription->billing_cycle,
                'amount' => $this->subscriptionAmount($subscription),
                'currency' => $subscription->currency,
            ]);

        return response()->json(['data' => $subscriptions->values()]);
    }

    private function monthlyRecurringRevenue($subscriptions): float
    {
        return round($subscriptions->sum(function (Subscription $subscription): float {
            $amount = $this->subscriptionAmount($subscription);

            return match ($subscription->billing_cycle) {
                'quarterly' => $amount / 3,
                'semi_annual' => $amount / 6,
                'yearly' => $amount / 12,
                default => $amount,
            };
        }), 2);
    }

    private function subscriptionAmount(Subscription $subscription): float
    {
        return round($subscription->items->sum(function ($item): float {
            $line = ((float) $item->quantity * (float) $item->unit_price) - (float) $item->discount;

            return $line + ($line * ((float) $item->tax_rate / 100));
        }), 2);
    }

    private function overdueQuery(int $companyId, ?Carbon $from = null, ?Carbon $to = null)
    {
        $query = Invoice::where('company_id', $companyId)
            ->whereIn('status', ['sent', 'partially_paid', 'overdue'])
            ->whereDate('due_date', '<', now()->toDateString())
            ->where('balance', '>', 0);

        if ($from && $to) {
            $query->whereBetween('due_date', [$from, $to]);
        }

        return $query;
    }

    private function dateRange(Request $request, int $defaultDays = 0): array
    {
        $from = $request->filled('from') ? Carbon::parse($request->input('from')) : ($defaultDays ? today()->subDays($defaultDays) : today()->startOfYear());
        $to = $request->filled('to') ? Carbon::parse($request->input('to')) : today()->endOfDay();

        abort_if($from->gt($to), 422, 'The from date must be before the to date.');

        return [$from, $to];
    }
}