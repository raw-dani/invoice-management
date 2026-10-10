<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceResource;
use App\Http\Resources\QuoteResource;
use App\Models\ActivityLog;
use App\Models\Invoice;
use App\Models\Notification;
use App\Models\Quote;
use App\Models\Setting;
use App\Services\PdfService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PublicPortalController extends Controller
{
    private function resolveInvoice(string $token): Invoice
    {
        $invoice = Invoice::with(['customer', 'items.product', 'company'])
            ->where(function ($query) use ($token) {
                $query->where('public_token', $token);
                if (is_numeric($token)) {
                    $query->orWhere('id', (int) $token);
                }
            })
            ->firstOrFail();

        if (empty($invoice->public_token)) {
            $invoice->public_token = Str::random(32);
            $invoice->saveQuietly();
        }

        return $invoice;
    }

    private function resolveQuote(string $token): Quote
    {
        $quote = Quote::with(['customer', 'items.product', 'company'])
            ->where(function ($query) use ($token) {
                $query->where('public_token', $token);
                if (is_numeric($token)) {
                    $query->orWhere('id', (int) $token);
                }
            })
            ->firstOrFail();

        if (empty($quote->public_token)) {
            $quote->public_token = Str::random(32);
            $quote->saveQuietly();
        }

        return $quote;
    }

    public function showInvoice(string $token): JsonResponse
    {
        $invoice = $this->resolveInvoice($token);

        ActivityLog::record('invoice.viewed', "Invoice {$invoice->invoice_number} dilihat oleh klien di portal", $invoice);

        // Payment and bank settings
        $paymentKeys = [
            'bank_name', 'account_name', 'account_number', 'instructions',
            'active_gateway',
            'midtrans_enabled', 'midtrans_mode', 'midtrans_client_key',
            'xendit_enabled', 'xendit_mode',
            'doku_enabled', 'doku_mode',
            'duitku_enabled', 'duitku_mode',
        ];
        $paymentSettings = Setting::where('company_id', $invoice->company_id)
            ->whereIn('key', $paymentKeys)
            ->pluck('value', 'key');

        $companyData = $invoice->company ? [
            'id' => $invoice->company->id,
            'name' => $invoice->company->name,
            'logo' => $invoice->company->logo ? (str_starts_with($invoice->company->logo, 'http') ? $invoice->company->logo : '/storage/' . $invoice->company->logo) : null,
            'email' => $invoice->company->email,
            'phone' => $invoice->company->phone,
            'address' => $invoice->company->address,
            'tax_number' => $invoice->company->tax_number,
        ] : null;

        return response()->json([
            'invoice' => new InvoiceResource($invoice),
            'company' => $companyData,
            'bank' => [
                'bank_name' => $paymentSettings['bank_name'] ?? null,
                'account_name' => $paymentSettings['account_name'] ?? null,
                'account_number' => $paymentSettings['account_number'] ?? null,
                'instructions' => $paymentSettings['instructions'] ?? null,
            ],
            'payment_gateways' => [
                'active' => $paymentSettings['active_gateway'] ?? 'manual',
                'midtrans' => [
                    'enabled' => ($paymentSettings['midtrans_enabled'] ?? '0') === '1',
                    'mode' => $paymentSettings['midtrans_mode'] ?? 'sandbox',
                    'client_key' => $paymentSettings['midtrans_client_key'] ?? null,
                ],
                'xendit' => [
                    'enabled' => ($paymentSettings['xendit_enabled'] ?? '0') === '1',
                    'mode' => $paymentSettings['xendit_mode'] ?? 'sandbox',
                ],
                'doku' => [
                    'enabled' => ($paymentSettings['doku_enabled'] ?? '0') === '1',
                    'mode' => $paymentSettings['doku_mode'] ?? 'sandbox',
                ],
                'duitku' => [
                    'enabled' => ($paymentSettings['duitku_enabled'] ?? '0') === '1',
                    'mode' => $paymentSettings['duitku_mode'] ?? 'sandbox',
                ],
            ],
        ]);
    }

    public function uploadInvoiceProof(Request $request, string $token): JsonResponse
    {
        $invoice = $this->resolveInvoice($token);

        if (in_array($invoice->status, ['paid', 'void', 'cancelled'], true)) {
            return response()->json(['message' => 'Invoice ini sudah lunas atau dibatalkan.'], 422);
        }

        $request->validate([
            'proof' => 'required|file|mimes:jpeg,jpg,png,webp,pdf|max:5120',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Delete old proof if exists
        if ($invoice->payment_proof_path && Storage::disk('public')->exists($invoice->payment_proof_path)) {
            Storage::disk('public')->delete($invoice->payment_proof_path);
        }

        $path = $request->file('proof')->store('payment-proofs', 'public');

        $invoice->update([
            'payment_proof_path' => $path,
            'payment_proof_status' => 'pending',
            'payment_proof_notes' => $request->input('notes'),
            'payment_proof_uploaded_at' => now(),
        ]);

        ActivityLog::record(
            'payment_proof.uploaded',
            "Pelanggan mengunggah bukti pembayaran untuk invoice {$invoice->invoice_number}",
            $invoice,
            ['notes' => $request->input('notes')]
        );

        app(\App\Services\NotifyUser::class)->company(
            (string) $invoice->company_id,
            'payment_proof_uploaded',
            'Bukti Pembayaran Diterima',
            "Pelanggan telah mengunggah bukti transfer untuk {$invoice->invoice_number}. Harap periksa dan verifikasi.",
            [
                'invoice_id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
            ]
        );

        return response()->json([
            'message' => 'Bukti pembayaran berhasil diunggah dan sedang diverifikasi oleh admin.',
            'invoice' => new InvoiceResource($invoice->fresh()),
        ]);
    }

    public function showQuote(string $token): JsonResponse
    {
        $quote = $this->resolveQuote($token);

        if ($quote->status === 'sent') {
            $quote->update(['status' => 'viewed']);
            ActivityLog::record('quote.viewed', "Penawaran {$quote->quote_number} dilihat oleh klien di portal", $quote);
        }

        $companyData = $quote->company ? [
            'id' => $quote->company->id,
            'name' => $quote->company->name,
            'logo' => $quote->company->logo ? (str_starts_with($quote->company->logo, 'http') ? $quote->company->logo : '/storage/' . $quote->company->logo) : null,
            'email' => $quote->company->email,
            'phone' => $quote->company->phone,
            'address' => $quote->company->address,
        ] : null;

        return response()->json([
            'quote' => new QuoteResource($quote),
            'company' => $companyData,
        ]);
    }

    public function acceptQuote(Request $request, string $token): JsonResponse
    {
        $quote = $this->resolveQuote($token);

        if (!in_array($quote->status, ['draft', 'sent', 'viewed'], true)) {
            return response()->json(['message' => 'Status penawaran saat ini tidak dapat disetujui.'], 422);
        }

        $quote->update(['status' => 'accepted']);

        ActivityLog::record('quote.accepted', "Penawaran {$quote->quote_number} disetujui oleh klien via portal", $quote);

        app(\App\Services\NotifyUser::class)->company(
            (string) $quote->company_id,
            'quote_accepted',
            'Penawaran Disetujui!',
            "Klien telah menyetujui penawaran {$quote->quote_number}.",
            ['quote_id' => $quote->id]
        );

        return response()->json([
            'message' => 'Terima kasih! Penawaran berhasil disetujui.',
            'quote' => new QuoteResource($quote->fresh()),
        ]);
    }

    public function rejectQuote(Request $request, string $token): JsonResponse
    {
        $quote = $this->resolveQuote($token);

        if (!in_array($quote->status, ['draft', 'sent', 'viewed'], true)) {
            return response()->json(['message' => 'Status penawaran tidak dapat diubah.'], 422);
        }

        $quote->update(['status' => 'rejected']);

        ActivityLog::record('quote.rejected', "Penawaran {$quote->quote_number} ditolak oleh klien via portal", $quote);

        return response()->json([
            'message' => 'Status penawaran telah diperbarui.',
            'quote' => new QuoteResource($quote->fresh()),
        ]);
    }

    public function downloadInvoicePdf(string $token): Response
    {
        $invoice = $this->resolveInvoice($token);
        $pdf = app(PdfService::class)->renderInvoice($invoice);

        return response($pdf)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="invoice-' . $invoice->invoice_number . '.pdf"');
    }

    public function downloadQuotePdf(string $token): Response
    {
        $quote = $this->resolveQuote($token);
        $pdf = app(PdfService::class)->renderQuote($quote);

        return response($pdf)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="quote-' . $quote->quote_number . '.pdf"');
    }
}
