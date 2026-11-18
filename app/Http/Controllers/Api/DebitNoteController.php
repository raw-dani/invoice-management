<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DebitNote;
use App\Models\DebitNoteItem;
use App\Models\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DebitNoteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $companyId = $request->user()->company_id;

        $query = DebitNote::with(['customer', 'invoice'])
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
                $q->where('debit_note_number', 'like', "%{$search}%")
                  ->orWhere('reason', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->where('company_name', 'like', "%{$search}%");
                  });
            });
        }

        $debitNotes = $query->orderByDesc('id')
            ->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $debitNotes->items(),
            'meta' => [
                'current_page' => $debitNotes->currentPage(),
                'last_page' => $debitNotes->lastPage(),
                'per_page' => $debitNotes->perPage(),
                'total' => $debitNotes->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $companyId = $request->user()->company_id;

        $validated = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'invoice_id' => ['nullable', 'exists:invoices,id'],
            'debit_note_date' => ['required', 'date'],
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
            $debitNote = new DebitNote();
            $debitNote->company_id = $companyId;
            $debitNote->customer_id = $validated['customer_id'];
            $debitNote->invoice_id = $validated['invoice_id'] ?? null;
            $debitNote->debit_note_number = DebitNote::generateNumber($companyId);
            $debitNote->debit_note_date = $validated['debit_note_date'];
            $debitNote->status = 'open';
            $debitNote->reason = $validated['reason'] ?? null;
            $debitNote->notes = $validated['notes'] ?? null;
            $debitNote->tax_rate = $validated['tax_rate'] ?? 0;
            $debitNote->currency = 'IDR';
            $debitNote->save();

            $subtotal = 0;
            $taxAmount = 0;

            foreach ($validated['items'] as $itemData) {
                $lineTaxRate = $itemData['tax_rate'] ?? $debitNote->tax_rate;
                $lineSubtotal = $itemData['quantity'] * $itemData['unit_price'];
                $lineTax = $lineSubtotal * ($lineTaxRate / 100);
                $lineTotal = $lineSubtotal + $lineTax;

                DebitNoteItem::create([
                    'debit_note_id' => $debitNote->id,
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

            $debitNote->subtotal = $subtotal;
            $debitNote->tax_amount = $taxAmount;
            $debitNote->total = $subtotal + $taxAmount;
            $debitNote->paid_amount = 0;
            $debitNote->save();

            return response()->json([
                'success' => true,
                'message' => 'Debit Note berhasil dibuat.',
                'data' => $debitNote->load(['customer', 'invoice', 'items']),
            ], 201);
        });
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $companyId = $request->user()->company_id;

        $debitNote = DebitNote::with(['customer', 'invoice', 'items.product'])
            ->where('company_id', $companyId)
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $debitNote,
        ]);
    }

    public function void(Request $request, int $id): JsonResponse
    {
        $companyId = $request->user()->company_id;
        $debitNote = DebitNote::where('company_id', $companyId)->findOrFail($id);

        if ($debitNote->status === 'void') {
            return response()->json(['success' => false, 'message' => 'Debit Note sudah berstatus void.'], 422);
        }

        $debitNote->status = 'void';
        $debitNote->save();

        return response()->json([
            'success' => true,
            'message' => 'Debit Note berhasil dibatalkan (void).',
            'data' => $debitNote,
        ]);
    }

    public function downloadPdf(Request $request, int $id)
    {
        $companyId = $request->user()->company_id;
        $debitNote = DebitNote::with(['company', 'customer', 'invoice', 'items'])
            ->where('company_id', $companyId)
            ->findOrFail($id);

        $pdf = Pdf::loadView('pdf.debit-note', ['debitNote' => $debitNote]);
        return $pdf->download("Debit_Note_{$debitNote->debit_note_number}.pdf");
    }
}
