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

        $counts = Subscription::where('company_id', $companyId)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        $activeSubscriptions = Subscription::with('items')
            ->where('company_id', $companyId)
            ->where('status', 'active')
            ->get();

        $mrr = round($activeSubscriptions->sum(fn ($subscription) => $this->monthlyAmount($subscription)), 2);

        $upcoming = Subscription::where('company_id', $companyId)
            ->where('status', 'active')
            ->where('next_billing_date', '>=', today())
            ->orderBy('next_billing_date')
            ->limit(10)
            ->get(['subscription_number', 'next_billing_date', 'billing_cycle'])
            ->map(fn ($subscription) => [
                'subscription_number' => $subscription->subscription_number,
                'next_billing_date' => $subscription->next_billing_date?->toDateString(),
                'billing_cycle' => $subscription->billing_cycle,
            ]);

        return response()->json(['data' => [
            'active' => $counts['active'] ?? 0,
            'paused' => $counts['paused'] ?? 0,
            'cancelled' => $counts['cancelled'] ?? 0,
            'mrr' => $mrr,
            'upcoming' => $upcoming,
        ]]);
    }

    public function arAging(Request $request): JsonResponse
    {
        $companyId = auth()->user()->company_id;
        $today = Carbon::today();

        // Get all unpaid invoices with positive balance
        $invoices = Invoice::with('customer')
            ->where('company_id', $companyId)
            ->where('balance', '>', 0)
            ->whereNotIn('status', ['draft', 'cancelled', 'void'])
            ->orderBy('due_date')
            ->get();

        $summary = [
            'total_receivables' => 0.0,
            'current'           => 0.0,
            'days_1_30'         => 0.0,
            'days_31_60'        => 0.0,
            'days_61_90'        => 0.0,
            'days_over_90'      => 0.0,
            'invoice_count'     => $invoices->count(),
            'customer_count'    => 0,
        ];

        $customerMap = [];

        foreach ($invoices as $inv) {
            $balance = (float) $inv->balance;
            $summary['total_receivables'] += $balance;

            $dueDate = Carbon::parse($inv->due_date);
            $daysOverdue = $today->gt($dueDate) ? $dueDate->diffInDays($today) : 0;

            $bucket = 'current';
            if ($daysOverdue > 90) {
                $bucket = 'days_over_90';
            } elseif ($daysOverdue > 60) {
                $bucket = 'days_61_90';
            } elseif ($daysOverdue > 30) {
                $bucket = 'days_31_60';
            } elseif ($daysOverdue > 0) {
                $bucket = 'days_1_30';
            }

            $summary[$bucket] += $balance;

            $cid = $inv->customer_id;
            if (!isset($customerMap[$cid])) {
                $customerMap[$cid] = [
                    'customer_id'    => $cid,
                    'customer_name'  => $inv->customer->company_name ?? 'Pelanggan Tidak Diketahui',
                    'contact_name'   => $inv->customer->contact_name ?? null,
                    'phone'          => $inv->customer->phone ?? null,
                    'email'          => $inv->customer->email ?? null,
                    'total_balance'  => 0.0,
                    'current'        => 0.0,
                    'days_1_30'      => 0.0,
                    'days_31_60'     => 0.0,
                    'days_61_90'     => 0.0,
                    'days_over_90'   => 0.0,
                    'invoices_count' => 0,
                    'oldest_due_date'=> $inv->due_date?->toDateString(),
                    'invoices'       => [],
                ];
            }

            $customerMap[$cid]['total_balance'] += $balance;
            $customerMap[$cid][$bucket] += $balance;
            $customerMap[$cid]['invoices_count']++;
            $customerMap[$cid]['invoices'][] = [
                'id'             => $inv->id,
                'invoice_number' => $inv->invoice_number,
                'due_date'       => $inv->due_date?->toDateString(),
                'balance'        => $balance,
                'days_overdue'   => $daysOverdue,
                'bucket'         => $bucket,
                'public_token'   => $inv->public_token,
            ];
        }

        $summary['customer_count'] = count($customerMap);
        $totalOverdue = $summary['days_1_30'] + $summary['days_31_60'] + $summary['days_61_90'] + $summary['days_over_90'];
        $summary['total_overdue'] = $totalOverdue;
        $summary['overdue_percentage'] = $summary['total_receivables'] > 0
            ? round(($totalOverdue / $summary['total_receivables']) * 100, 1)
            : 0;

        $customerRows = collect($customerMap)
            ->sortByDesc('total_balance')
            ->values()
            ->all();

        return response()->json([
            'data' => [
                'as_of_date' => $today->toDateString(),
                'summary'    => $summary,
                'customers'  => $customerRows,
            ],
        ]);
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

    public function exportCsv(Request $request)
    {
        $type = $request->input('type', 'revenue');
        [$from, $to] = $this->dateRange($request);

        $callback = function () use ($type, $request) {
            $handle = fopen('php://output', 'w');

            if ($type === 'revenue') {
                fputcsv($handle, ['Category/Period', 'Revenue (IDR)', 'Quantity']);
                $data = $this->revenue($request)->getData(true)['data']['rows'];
                foreach ($data as $row) {
                    fputcsv($handle, [
                        $row['label'] ?? '',
                        $row['revenue'] ?? 0,
                        $row['quantity'] ?? '',
                    ]);
                }
            } elseif ($type === 'invoices') {
                fputcsv($handle, ['Status', 'Count', 'Total (IDR)', 'Balance (IDR)']);
                $data = $this->invoices($request)->getData(true)['data']['rows'];
                foreach ($data as $row) {
                    fputcsv($handle, [
                        $row['status'] ?? '',
                        $row['count'] ?? 0,
                        $row['total'] ?? 0,
                        $row['balance'] ?? 0,
                    ]);
                }
            } elseif ($type === 'customers') {
                fputcsv($handle, ['Customer Name', 'Outstanding Balance (IDR)']);
                $data = $this->customers($request)->getData(true)['data']['balances'];
                foreach ($data as $row) {
                    fputcsv($handle, [
                        $row['customer'] ?? '',
                        $row['balance'] ?? 0,
                    ]);
                }
            } elseif ($type === 'subscriptions') {
                fputcsv($handle, ['Subscription Number', 'Billing Cycle', 'Next Billing Date']);
                $data = $this->subscriptions()->getData(true)['data']['upcoming'];
                foreach ($data as $row) {
                    fputcsv($handle, [
                        $row['subscription_number'] ?? '',
                        $row['billing_cycle'] ?? '',
                        $row['next_billing_date'] ?? '',
                    ]);
                }
            }

            fclose($handle);
        };

        $filename = "report-{$type}-{$from->toDateString()}-to-{$to->toDateString()}.csv";

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    public function exportPdf(Request $request)
    {
        $type = $request->input('type', 'revenue');
        [$from, $to] = $this->dateRange($request);
        $company = auth()->user()->company ?? new \App\Models\Company(['name' => 'Company']);

        $viewData = [
            'type' => $type,
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'company' => $company,
        ];

        if ($type === 'revenue') {
            $viewData['rows'] = $this->revenue($request)->getData(true)['data']['rows'];
        } elseif ($type === 'invoices') {
            $viewData['rows'] = $this->invoices($request)->getData(true)['data']['rows'];
        } elseif ($type === 'customers') {
            $cData = $this->customers($request)->getData(true)['data'];
            $viewData['statusRows'] = $cData['status'];
            $viewData['balances'] = $cData['balances'];
        } elseif ($type === 'subscriptions') {
            $viewData['data'] = $this->subscriptions()->getData(true)['data'];
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.report.summary', $viewData)
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'defaultFont' => 'sans-serif',
            ]);

        $filename = "report-{$type}-{$from->toDateString()}-to-{$to->toDateString()}.pdf";

        return response()->make($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}