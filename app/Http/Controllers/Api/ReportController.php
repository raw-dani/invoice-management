<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Payment;
use App\Models\Subscription;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function revenue(Request $request): JsonResponse
    {
        [$from, $to] = $this->dateRange($request);
        $companyId = auth()->user()->company_id;
        $groupBy = $request->input('group_by', 'month');

        if ($groupBy === 'customer') {
            $rows = Payment::where('payments.company_id', $companyId)->whereBetween('payment_date', [$from, $to])
                ->join('customers', 'customers.id', '=', 'payments.customer_id')
                ->select('customers.id', 'customers.company_name as label', DB::raw('SUM(payments.amount) as revenue'))
                ->groupBy('customers.id', 'customers.company_name')->orderByDesc('revenue')->get();
        } elseif ($groupBy === 'product') {
            $rows = InvoiceItem::whereHas('invoice', fn ($query) => $query->where('company_id', $companyId)->where('status', 'paid')->whereBetween('invoice_date', [$from, $to]))
                ->leftJoin('products', 'products.id', '=', 'invoice_items.product_id')
                ->selectRaw("COALESCE(products.name, invoice_items.description) as label, SUM(invoice_items.total) as revenue, SUM(invoice_items.quantity) as quantity")
                ->groupBy('label')->orderByDesc('revenue')->get();
        } else {
            $rows = Payment::where('company_id', $companyId)->whereBetween('payment_date', [$from, $to])
                ->selectRaw("DATE_FORMAT(payment_date, '%Y-%m') as label, SUM(amount) as revenue")
                ->groupBy('label')->orderBy('label')->get();
        }

        return response()->json(['data' => ['from' => $from->toDateString(), 'to' => $to->toDateString(), 'group_by' => $groupBy, 'rows' => $rows]]);
    }

    public function invoices(Request $request): JsonResponse
    {
        [$from, $to] = $this->dateRange($request);
        $rows = Invoice::where('company_id', auth()->user()->company_id)
            ->whereBetween('invoice_date', [$from, $to])
            ->select('status', DB::raw('COUNT(*) as count'), DB::raw('SUM(total) as total'), DB::raw('SUM(balance) as balance'))
            ->groupBy('status')->orderBy('status')->get();

        return response()->json(['data' => ['from' => $from->toDateString(), 'to' => $to->toDateString(), 'rows' => $rows]]);
    }

    public function customers(Request $request): JsonResponse
    {
        [$from, $to] = $this->dateRange($request);
        $companyId = auth()->user()->company_id;
        $rows = Customer::where('company_id', $companyId)->whereBetween('created_at', [$from->startOfDay(), $to->endOfDay()])
            ->select('status', DB::raw('COUNT(*) as count'))->groupBy('status')->orderBy('status')->get();
        $balances = Invoice::where('invoices.company_id', $companyId)->where('invoices.balance', '>', 0)
            ->join('customers', 'customers.id', '=', 'invoices.customer_id')
            ->select('customers.company_name as customer', DB::raw('SUM(invoices.balance) as balance'))
            ->groupBy('customers.id', 'customers.company_name')->orderByDesc('balance')->limit(10)->get();

        return response()->json(['data' => ['from' => $from->toDateString(), 'to' => $to->toDateString(), 'status' => $rows, 'balances' => $balances]]);
    }

    public function subscriptions(): JsonResponse
    {
        $companyId = auth()->user()->company_id;
        $subscriptions = Subscription::with('items')->where('company_id', $companyId)->get();
        $mrr = round($subscriptions->where('status', 'active')->sum(fn ($subscription) => $this->monthlyAmount($subscription)), 2);

        return response()->json(['data' => [
            'active' => $subscriptions->where('status', 'active')->count(),
            'paused' => $subscriptions->where('status', 'paused')->count(),
            'cancelled' => $subscriptions->where('status', 'cancelled')->count(),
            'mrr' => $mrr,
            'upcoming' => $subscriptions->where('status', 'active')->where('next_billing_date', '>=', today())->sortBy('next_billing_date')->take(10)->values()->map(fn ($subscription) => [
                'subscription_number' => $subscription->subscription_number,
                'next_billing_date' => $subscription->next_billing_date?->toDateString(),
                'billing_cycle' => $subscription->billing_cycle,
            ]),
        ]]);
    }

    private function dateRange(Request $request): array
    {
        $from = $request->filled('from') ? Carbon::parse($request->input('from')) : today()->startOfYear();
        $to = $request->filled('to') ? Carbon::parse($request->input('to')) : today()->endOfDay();

        abort_if($from->gt($to), 422, 'The from date must be before the to date.');

        return [$from, $to];
    }

    private function monthlyAmount(Subscription $subscription): float
    {
        $amount = $subscription->items->sum(function ($item): float {
            $line = ((float) $item->quantity * (float) $item->unit_price) - (float) $item->discount;

            return $line + ($line * ((float) $item->tax_rate / 100));
        });

        return match ($subscription->billing_cycle) {
            'quarterly' => $amount / 3,
            'semi_annual' => $amount / 6,
            'yearly' => $amount / 12,
            default => $amount,
        };
    }
}