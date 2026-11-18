<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CreditNote;
use App\Models\Customer;
use App\Models\DebitNote;
use App\Models\Invoice;
use App\Models\Payment;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerStatementController extends Controller
{
    /**
     * Generate statement of account data for a customer.
     */
    public function getStatement(Request $request, int $customerId): JsonResponse
    {
        $companyId = $request->user()->company_id;
        $customer = Customer::where('company_id', $companyId)->findOrFail($customerId);

        $startDate = $request->input('start_date', Carbon::now()->startOfYear()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->toDateString());

        $data = $this->buildStatementData($customer, $startDate, $endDate);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Download customer statement as PDF.
     */
    public function downloadPdf(Request $request, int $customerId)
    {
        $companyId = $request->user()->company_id;
        $customer = Customer::with('company')->where('company_id', $companyId)->findOrFail($customerId);

        $startDate = $request->input('start_date', Carbon::now()->startOfYear()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->toDateString());

        $data = $this->buildStatementData($customer, $startDate, $endDate);

        $pdf = Pdf::loadView('pdf.customer-statement', [
            'customer' => $customer,
            'company' => $customer->company,
            'statement' => $data,
            'startDate' => $startDate,
            'endDate' => $endDate,
        ]);

        return $pdf->download("Statement_{$customer->customer_number}_{$startDate}_to_{$endDate}.pdf");
    }

    private function buildStatementData(Customer $customer, string $startDate, string $endDate): array
    {
        // 1. Calculate Opening Balance before $startDate
        $priorInvoicesTotal = Invoice::where('customer_id', $customer->id)
            ->where('invoice_date', '<', $startDate)
            ->whereNotIn('status', ['void', 'cancelled'])
            ->sum('total');

        $priorPaymentsTotal = Payment::where('customer_id', $customer->id)
            ->where('payment_date', '<', $startDate)
            ->sum('amount');

        $priorCreditNotesTotal = CreditNote::where('customer_id', $customer->id)
            ->where('credit_note_date', '<', $startDate)
            ->where('status', '!=', 'void')
            ->sum('allocated_amount');

        $priorDebitNotesTotal = DebitNote::where('customer_id', $customer->id)
            ->where('debit_note_date', '<', $startDate)
            ->where('status', '!=', 'void')
            ->sum('total');

        $openingBalance = (float)($priorInvoicesTotal + $priorDebitNotesTotal - $priorPaymentsTotal - $priorCreditNotesTotal);

        // 2. Collect transactions between $startDate and $endDate
        $transactions = collect();

        // Invoices
        $invoices = Invoice::where('customer_id', $customer->id)
            ->whereBetween('invoice_date', [$startDate, $endDate])
            ->whereNotIn('status', ['void', 'cancelled'])
            ->get();

        foreach ($invoices as $inv) {
            $transactions->push([
                'date' => $inv->invoice_date->toDateString(),
                'type' => 'Invoice',
                'reference' => $inv->invoice_number,
                'description' => "Penjualan / Tagihan (" . strtoupper($inv->status) . ")",
                'debit' => (float)$inv->total, // Piutang bertambah
                'credit' => 0,
                'created_at' => $inv->created_at,
            ]);
        }

        // Payments
        $payments = Payment::where('customer_id', $customer->id)
            ->whereBetween('payment_date', [$startDate, $endDate])
            ->get();

        foreach ($payments as $pmt) {
            $transactions->push([
                'date' => $pmt->payment_date ? Carbon::parse($pmt->payment_date)->toDateString() : $pmt->created_at->toDateString(),
                'type' => 'Payment',
                'reference' => $pmt->payment_number,
                'description' => "Pembayaran via " . strtoupper($pmt->payment_method ?? 'Transfer'),
                'debit' => 0,
                'credit' => (float)$pmt->amount, // Piutang berkurang
                'created_at' => $pmt->created_at,
            ]);
        }

        // Credit Notes
        $creditNotes = CreditNote::where('customer_id', $customer->id)
            ->whereBetween('credit_note_date', [$startDate, $endDate])
            ->where('status', '!=', 'void')
            ->get();

        foreach ($creditNotes as $cn) {
            $transactions->push([
                'date' => $cn->credit_note_date->toDateString(),
                'type' => 'Credit Note',
                'reference' => $cn->credit_note_number,
                'description' => "Kredit / Retur: " . ($cn->reason ?: 'Penyesuaian'),
                'debit' => 0,
                'credit' => (float)$cn->allocated_amount, // Mengurangi piutang
                'created_at' => $cn->created_at,
            ]);
        }

        // Debit Notes
        $debitNotes = DebitNote::where('customer_id', $customer->id)
            ->whereBetween('debit_note_date', [$startDate, $endDate])
            ->where('status', '!=', 'void')
            ->get();

        foreach ($debitNotes as $dn) {
            $transactions->push([
                'date' => $dn->debit_note_date->toDateString(),
                'type' => 'Debit Note',
                'reference' => $dn->debit_note_number,
                'description' => "Debit Tambahan: " . ($dn->reason ?: 'Penyesuaian Biaya'),
                'debit' => (float)$dn->total,
                'credit' => 0,
                'created_at' => $dn->created_at,
            ]);
        }

        // Sort by date ascending
        $sorted = $transactions->sortBy(function ($item) {
            return $item['date'] . '_' . $item['created_at'];
        })->values();

        // Calculate running balance
        $currentBalance = $openingBalance;
        $itemsWithBalance = [];
        $totalDebit = 0;
        $totalCredit = 0;

        foreach ($sorted as $item) {
            $totalDebit += $item['debit'];
            $totalCredit += $item['credit'];
            $currentBalance += ($item['debit'] - $item['credit']);

            $item['running_balance'] = $currentBalance;
            $itemsWithBalance[] = $item;
        }

        return [
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->company_name,
                'number' => $customer->customer_number,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'credit_limit' => $customer->credit_limit,
            ],
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'opening_balance' => $openingBalance,
            'total_debit' => $totalDebit,
            'total_credit' => $totalCredit,
            'closing_balance' => $currentBalance,
            'transactions' => $itemsWithBalance,
        ];
    }
}
