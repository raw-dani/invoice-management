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
    public function summary(): JsonResponse
    {
        $companyId = auth()->user()->company_id;
        $invoices = Invoice::where('company_id', $companyId);
        $overdue = $this->overdueQuery($companyId);
        $activeSubscriptions = Subscription::with('items')
            ->where('company_id', $companyId)
            ->where('status', 'active')
            ->get();

        return response()->json([
            'data' => [
                'total_revenue' => (float) (clone $invoices)
                    ->where('status', 'paid')
                    ->sum('paid_amount'),
                'outstanding' => (float) (clone $invoices)
                    ->whereIn('status', ['sent', 'partially_paid', 'overdue'])
                    ->sum('balance'),
                'overdue_count' => $overdue->count(),
                'customers_count' => Customer::where('company_id', $companyId)->count(),
                'mrr' => $this->monthlyRecurringRevenue($activeSubscriptions),
            ],
        ]);
    }

    public function recentInvoices(): JsonResponse
    {
        $invoices = Invoice::with('customer')
            ->where('company_id', auth()->user()->company_id)
            ->latest()
            ->limit(5)
            ->get();

        return response()->json([
            'data' => InvoiceResource::collection($invoices)->resolve(),
        ]);
    }

    public function overdueInvoices(): JsonResponse
    {
        $invoices = $this->overdueQuery(auth()->user()->company_id)
            ->with('customer')
            ->orderBy('due_date')
            ->limit(10)
            ->get();

        return response()->json([
            'data' => InvoiceResource::collection($invoices)->resolve(),
        ]);
    }

    public function upcomingBilling(): JsonResponse
    {
        $subscriptions = Subscription::with('customer', 'items')
            ->where('company_id', auth()->user()->company_id)
            ->where('status', 'active')
            ->whereBetween('next_billing_date', [today(), today()->addDays(30)])
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

    private function overdueQuery(int $companyId)
    {
        return Invoice::where('company_id', $companyId)
            ->whereIn('status', ['sent', 'partially_paid', 'overdue'])
            ->whereDate('due_date', '<', now()->toDateString())
            ->where('balance', '>', 0);
    }
}