<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\SendInvoiceEmail;
use App\Jobs\SendQuoteEmail;
use App\Models\Invoice;
use App\Models\Quote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailController extends Controller
{
    public function sendInvoice(Request $request, Invoice $invoice): JsonResponse
    {
        if ($invoice->company_id !== auth()->user()->company_id) {
            abort(403, 'Unauthorized action.');
        }

        $data = $request->validate([
            'to'      => ['nullable', 'email'],
            'subject' => ['nullable', 'string', 'max:255'],
            'message' => ['nullable', 'string'],
        ]);

        // Dispatch job. With QUEUE_CONNECTION=sync this runs inline.
        SendInvoiceEmail::dispatch($invoice->id);

        return response()->json([
            'success' => true,
            'message' => 'Invoice email queued for delivery.',
            'data'    => [
                'invoice_id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'recipient' => $data['to'] ?? optional($invoice->customer)->email,
            ],
        ]);
    }

    public function sendQuote(Request $request, Quote $quote): JsonResponse
    {
        if ($quote->company_id !== auth()->user()->company_id) {
            abort(403, 'Unauthorized action.');
        }

        $data = $request->validate([
            'to'      => ['nullable', 'email'],
            'subject' => ['nullable', 'string', 'max:255'],
            'message' => ['nullable', 'string'],
        ]);

        SendQuoteEmail::dispatch($quote->id);

        return response()->json([
            'success' => true,
            'message' => 'Quote email queued for delivery.',
            'data'    => [
                'quote_id' => $quote->id,
                'quote_number' => $quote->quote_number,
                'recipient' => $data['to'] ?? optional($quote->customer)->email,
            ],
        ]);
    }
}
