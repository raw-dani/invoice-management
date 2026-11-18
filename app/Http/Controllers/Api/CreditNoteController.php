<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CreditNote;
use App\Models\CreditNoteAllocation;
use App\Models\CreditNoteItem;
use App\Models\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CreditNoteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $companyId = $request->user()->company_id;

        $query = CreditNote::with(['customer', 'invoice'])
            ->where('company_id', $companyId);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('credit_note_number', 'like', "%{$search}%")
                  ->orWhere('reason', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->where('company_name', 'like', "%{$search}%");
                  });
            });
        }

        $creditNotes = $query->orderByDesc('id')
            ->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $creditNotes->items(),
            'meta' => [
                'current_page' => $creditNotes->currentPage(),
                'last_page' => $creditNotes->lastPage(),
                'per_page' => $creditNotes->perPage(),
                'total' => $creditNotes->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $companyId = $request->user()->company_id;

        $validated = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'invoice_id' => ['nullable', 'exists:invoices,id'],
            'credit_note_date' => ['required', 'date'],
            'reason' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['nullable', 'exists:products,id'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        return DB::transaction(function () use ($validated, $companyId) {
            $creditNote = new CreditNote();
            $creditNote->company_id = $companyId;
            $creditNote->customer_id = $validated['customer_id'];
            $creditNote->invoice_id = $validated['invoice_id'] ?? null;
            $creditNote->credit_note_number = CreditNote::generateNumber($companyId);
            $creditNote->credit_note_date = $validated['credit_note_date'];
            $creditNote->status = 'open'; // default open ready to apply
            $creditNote->reason = $validated['reason'] ?? null;
            $creditNote->notes = $validated['notes'] ?? null;
            $creditNote->tax_rate = $validated['tax_rate'] ?? 0;
            $creditNote->currency = 'IDR';
            $creditNote->save();

            $subtotal = 0;
            $taxAmount = 0;

            foreach ($validated['items'] as $itemData) {
                $lineTaxRate = $itemData['tax_rate'] ?? $creditNote->tax_rate;
                $lineSubtotal = $itemData['quantity'] * $itemData['unit_price'];
                $lineTax = $lineSubtotal * ($lineTaxRate / 100);
                $lineTotal = $lineSubtotal + $lineTax;

                CreditNoteItem::create([
                    'credit_note_id' => $creditNote->id,
                    'product_id' => $itemData['product_id'] ?? null,
                    'description' => $itemData['description'],
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $itemData['unit_price'],
                    'tax_rate' => $lineTaxRate,
                    'tax_amount' => $lineTax,
                    'total' => $lineTotal,
                ]);

                $subtotal += $lineSubtotal;
                $taxAmount += $lineTax;
            }

            $creditNote->subtotal = $subtotal;
            $creditNote->tax_amount = $taxAmount;
            $creditNote->total = $subtotal + $taxAmount;
            $creditNote->allocated_amount = 0;
            $creditNote->remaining_balance = $creditNote->total;
            $creditNote->save();

            // If an invoice is referenced and has balance, auto-allocate if possible
            if (!empty($creditNote->invoice_id)) {
                $invoice = Invoice::where('company_id', $companyId)->find($creditNote->invoice_id);
                if ($invoice && (float)$invoice->balance > 0) {
                    $allocAmount = min((float)$creditNote->remaining_balance, (float)$invoice->balance);
                    if ($allocAmount > 0) {
                        CreditNoteAllocation::create([
                            'credit_note_id' => $creditNote->id,
                            'invoice_id' => $invoice->id,
                            'amount' => $allocAmount,
                            'allocated_at' => $creditNote->credit_note_date,
                            'notes' => 'Otomatis dialokasikan saat penerbitan Credit Note',
                        ]);

                        $creditNote->allocated_amount += $allocAmount;
                        $creditNote->remaining_balance -= $allocAmount;
                        if ($creditNote->remaining_balance <= 0) {
                            $creditNote->status = 'applied';
                        }
                        $creditNote->save();

                        // Kurangi balance invoice
                        $invoice->balance = max(0, (float)$invoice->balance - $allocAmount);
                        if ($invoice->balance == 0) {
                            $invoice->status = 'paid';
                        } elseif ($invoice->status === 'sent' || $invoice->status === 'overdue') {
                            $invoice->status = 'partially_paid';
                        }
                        $invoice->save();
                    }
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Credit Note berhasil dibuat.',
                'data' => $creditNote->load(['customer', 'invoice', 'items', 'allocations.invoice']),
            ], 201);
        });
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $companyId = $request->user()->company_id;

        $creditNote = CreditNote::with(['customer', 'invoice', 'items.product', 'allocations.invoice'])
            ->where('company_id', $companyId)
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $creditNote,
        ]);
    }

    public function allocate(Request $request, int $id): JsonResponse
    {
        $companyId = $request->user()->company_id;

        $creditNote = CreditNote::where('company_id', $companyId)->findOrFail($id);

        if ($creditNote->status === 'void') {
            return response()->json([
                'success' => false,
                'message' => 'Credit Note berstatus batal (void) tidak dapat dialokasikan.',
            ], 422);
        }

        if ((float)$creditNote->remaining_balance <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Saldo Credit Note sudah habis teralokasi.',
            ], 422);
        }

        $validated = $request->validate([
            'invoice_id' => ['required', 'exists:invoices,id'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:' . $creditNote->remaining_balance],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $invoice = Invoice::where('company_id', $companyId)
            ->where('customer_id', $creditNote->customer_id)
            ->findOrFail($validated['invoice_id']);

        if ((float)$invoice->balance <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice ini sudah lunas.',
            ], 422);
        }

        $amountToApply = min((float)$validated['amount'], (float)$invoice->balance);

        return DB::transaction(function () use ($creditNote, $invoice, $amountToApply, $validated) {
            CreditNoteAllocation::create([
                'credit_note_id' => $creditNote->id,
                'invoice_id' => $invoice->id,
                'amount' => $amountToApply,
                'allocated_at' => now()->toDateString(),
                'notes' => $validated['notes'] ?? 'Alokasi manual Credit Note',
            ]);

            $creditNote->allocated_amount = (float)$creditNote->allocated_amount + $amountToApply;
            $creditNote->remaining_balance = (float)$creditNote->total - (float)$creditNote->allocated_amount;
            if ($creditNote->remaining_balance <= 0.001) {
                $creditNote->remaining_balance = 0;
                $creditNote->status = 'applied';
            }
            $creditNote->save();

            $invoice->balance = max(0, (float)$invoice->balance - $amountToApply);
            if ($invoice->balance == 0) {
                $invoice->status = 'paid';
            } elseif (in_array($invoice->status, ['sent', 'overdue'])) {
                $invoice->status = 'partially_paid';
            }
            $invoice->save();

            return response()->json([
                'success' => true,
                'message' => "Berhasil mengalokasikan Rp " . number_format($amountToApply, 0, ',', '.') . " ke Invoice {$invoice->invoice_number}.",
                'data' => $creditNote->fresh(['allocations.invoice', 'customer']),
            ]);
        });
    }

    public function void(Request $request, int $id): JsonResponse
    {
        $companyId = $request->user()->company_id;
        $creditNote = CreditNote::where('company_id', $companyId)->findOrFail($id);

        if ($creditNote->status === 'void') {
            return response()->json(['success' => false, 'message' => 'Credit Note sudah berstatus void.'], 422);
        }

        if ((float)$creditNote->allocated_amount > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Credit Note yang sudah dialokasikan ke invoice tidak dapat dibatalkan langsung. Lepaskan alokasi terlebih dahulu.',
            ], 422);
        }

        $creditNote->status = 'void';
        $creditNote->save();

        return response()->json([
            'success' => true,
            'message' => 'Credit Note berhasil dibatalkan (void).',
            'data' => $creditNote,
        ]);
    }

    public function downloadPdf(Request $request, int $id)
    {
        $companyId = $request->user()->company_id;
        $creditNote = CreditNote::with(['company', 'customer', 'invoice', 'items', 'allocations.invoice'])
            ->where('company_id', $companyId)
            ->findOrFail($id);

        $pdf = Pdf::loadView('pdf.credit-note', ['creditNote' => $creditNote]);
        return $pdf->download("Credit_Note_{$creditNote->credit_note_number}.pdf");
    }
}
