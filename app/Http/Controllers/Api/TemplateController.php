<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\InvoiceTemplate;
use App\Models\Quote;
use App\Models\QuoteItem;
use App\Models\QuoteTemplate;
use App\Services\PdfService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Database\Eloquent\Model;

class TemplateController extends Controller
{
    public function invoiceTemplates(): JsonResponse
    {
        return response()->json(['data' => $this->templates(InvoiceTemplate::class)]);
    }

    public function quoteTemplates(): JsonResponse
    {
        return response()->json(['data' => $this->templates(QuoteTemplate::class)]);
    }

    public function activateInvoice(Request $request, InvoiceTemplate $invoiceTemplate): JsonResponse
    {
        return $this->activate($request, $invoiceTemplate, InvoiceTemplate::class);
    }

    public function activateQuote(Request $request, QuoteTemplate $quoteTemplate): JsonResponse
    {
        return $this->activate($request, $quoteTemplate, QuoteTemplate::class);
    }

    public function previewInvoice(string $slug, PdfService $pdf): Response
    {
        $companyId = auth()->user()->company_id;
        $invoice = $this->getSampleInvoice($companyId);
        $pdfContent = $pdf->renderInvoice($invoice, $slug);

        return response()->make($pdfContent, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => "inline; filename=\"invoice-preview-{$slug}.pdf\"",
        ]);
    }

    public function previewQuote(string $slug, PdfService $pdf): Response
    {
        $companyId = auth()->user()->company_id;
        $quote = $this->getSampleQuote($companyId);
        $pdfContent = $pdf->renderQuote($quote, $slug);

        return response()->make($pdfContent, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => "inline; filename=\"quote-preview-{$slug}.pdf\"",
        ]);
    }

    private function getSampleInvoice(int $companyId): Invoice
    {
        $invoice = Invoice::where('company_id', $companyId)->with(['customer', 'items.product', 'company'])->latest()->first();
        if ($invoice) {
            return $invoice;
        }

        $company = Company::find($companyId) ?? new Company([
            'name' => 'Demo Company PT',
            'address' => 'Jl. Jenderal Sudirman No. 45',
            'city' => 'Jakarta Selatan',
            'province' => 'DKI Jakarta',
            'country' => 'Indonesia',
            'email' => 'finance@democompany.com',
            'phone' => '+62 21 555-0199',
            'website' => 'https://democompany.com',
            'tax_number' => '01.234.567.8-901.000',
        ]);

        $customer = new Customer([
            'company_name' => 'PT Mitra Sejahtera Abadi',
            'contact_name' => 'Budi Santoso',
            'email' => 'budi.santoso@mitrasejahtera.co.id',
            'phone' => '+62 21 888-2345',
            'address' => 'Gedung Wisma Niaga Lt. 8, Kav. 12',
            'city' => 'Jakarta Selatan',
            'province' => 'DKI Jakarta',
            'tax_number' => '09.876.543.2-109.000',
        ]);

        $item1 = new InvoiceItem([
            'description' => 'Website Development & UI/UX Redesign',
            'quantity' => 1,
            'unit_price' => 12500000,
            'tax_rate' => 11,
            'discount' => 500000,
            'total' => 13320000,
        ]);
        $item1->setRelation('product', null);

        $item2 = new InvoiceItem([
            'description' => 'Cloud Hosting & SSL Certificate (1 Tahun)',
            'quantity' => 1,
            'unit_price' => 2500000,
            'tax_rate' => 11,
            'discount' => 0,
            'total' => 2775000,
        ]);
        $item2->setRelation('product', null);

        $sample = new Invoice([
            'invoice_number' => 'INV-2026-SAMPLE',
            'invoice_date' => now(),
            'due_date' => now()->addDays(14),
            'status' => 'sent',
            'currency' => 'IDR',
            'subtotal' => 14500000,
            'tax_amount' => 1595000,
            'discount_amount' => 500000,
            'total' => 16095000,
            'paid_amount' => 0,
            'balance' => 16095000,
            'notes' => 'Terima kasih atas kerja sama Anda. Pembayaran tepat waktu sangat kami hargai.',
            'terms' => 'Silakan transfer ke rekening Bank BCA 888-0123-456 a/n PT Demo Company.',
            'company_id' => $companyId,
        ]);

        $sample->setRelation('company', $company);
        $sample->setRelation('customer', $customer);
        $sample->setRelation('items', collect([$item1, $item2]));

        return $sample;
    }

    private function getSampleQuote(int $companyId): Quote
    {
        $quote = Quote::where('company_id', $companyId)->with(['customer', 'items.product', 'company'])->latest()->first();
        if ($quote) {
            return $quote;
        }

        $company = Company::find($companyId) ?? new Company([
            'name' => 'Demo Company PT',
            'address' => 'Jl. Jenderal Sudirman No. 45',
            'city' => 'Jakarta Selatan',
            'province' => 'DKI Jakarta',
            'country' => 'Indonesia',
            'email' => 'sales@democompany.com',
            'phone' => '+62 21 555-0199',
            'website' => 'https://democompany.com',
            'tax_number' => '01.234.567.8-901.000',
        ]);

        $customer = new Customer([
            'company_name' => 'PT Mitra Sejahtera Abadi',
            'contact_name' => 'Budi Santoso',
            'email' => 'budi.santoso@mitrasejahtera.co.id',
            'phone' => '+62 21 888-2345',
            'address' => 'Gedung Wisma Niaga Lt. 8, Kav. 12',
            'city' => 'Jakarta Selatan',
            'province' => 'DKI Jakarta',
            'tax_number' => '09.876.543.2-109.000',
        ]);

        $item1 = new QuoteItem([
            'description' => 'ERP & Invoice Management System Implementation',
            'quantity' => 1,
            'unit_price' => 18000000,
            'tax_rate' => 11,
            'discount' => 1000000,
            'total' => 18870000,
        ]);
        $item1->setRelation('product', null);

        $item2 = new QuoteItem([
            'description' => 'User Training & Onboarding (2 Sesi)',
            'quantity' => 2,
            'unit_price' => 1500000,
            'tax_rate' => 11,
            'discount' => 0,
            'total' => 3330000,
        ]);
        $item2->setRelation('product', null);

        $sample = new Quote([
            'quote_number' => 'QT-2026-SAMPLE',
            'quote_date' => now(),
            'valid_until' => now()->addDays(30),
            'status' => 'sent',
            'currency' => 'IDR',
            'subtotal' => 20000000,
            'tax_amount' => 2200000,
            'discount_amount' => 1000000,
            'total' => 22200000,
            'notes' => 'Penawaran ini mencakup lisensi penuh dan garansi pemeliharaan selama 3 bulan.',
            'terms' => 'Pembayaran termin 1 (DP 50%) saat PO ditandatangani, pelunasan setelah serah terima.',
            'company_id' => $companyId,
        ]);

        $sample->setRelation('company', $company);
        $sample->setRelation('customer', $customer);
        $sample->setRelation('items', collect([$item1, $item2]));

        return $sample;
    }

    private function templates(string $model): array
    {
        $companyId = auth()->user()->company_id;
        $companyTemplates = $model::where('company_id', $companyId)
            ->where(function ($q) {
                $q->where('is_active', true)->orWhere('is_default', true);
            })
            ->get();
        $activeSlug = $companyTemplates->firstWhere('is_default', true)?->slug;

        $templates = $companyTemplates->map(fn ($template) => $template->toArray())->toArray();

        $globalTemplates = $model::whereNull('company_id')->get();
        foreach ($globalTemplates as $template) {
            if ($activeSlug && $template->slug === $activeSlug) {
                continue;
            }
            $templates[] = (array) [
                'id' => $template->id,
                'name' => $template->name,
                'slug' => $template->slug,
                'company_id' => null,
                'is_active' => $activeSlug ? false : $template->is_active,
                'is_default' => $activeSlug ? false : $template->is_default,
            ];
        }

        usort($templates, function ($a, $b) {
            if ($a['is_default'] !== $b['is_default']) {
                return $b['is_default'] <=> $a['is_default'];
            }
            return $a['name'] <=> $b['name'];
        });

        return array_values($templates);
    }

    private function activate(Request $request, Model $template, string $model): JsonResponse
    {
        abort_unless($template->company_id === auth()->user()->company_id || $template->company_id === null, 403);

        $companyId = auth()->user()->company_id;
        $slug = $template->slug;
        
        $model::where('company_id', $companyId)->where('slug', '!=', $slug)->delete();
            
        $selected = $model::updateOrCreate(
            ['company_id' => $companyId, 'slug' => $slug],
            ['name' => $template->name, 'is_active' => true, 'is_default' => true]
        );

        return response()->json(['data' => $selected, 'message' => 'Template activated.']);
    }
}