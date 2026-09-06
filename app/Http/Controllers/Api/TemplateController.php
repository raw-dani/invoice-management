<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InvoiceTemplate;
use App\Models\QuoteTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

    private function templates(string $model): array
    {
        return $model::where('company_id', auth()->user()->company_id)
            ->orWhereNull('company_id')
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->get()
            ->toArray();
    }

    private function activate(Request $request, Model $template, string $model): JsonResponse
    {
        abort_unless($template->company_id === auth()->user()->company_id || $template->company_id === null, 403);

        $companyId = auth()->user()->company_id;
        $slug = $template->slug;
        $model::where('company_id', $companyId)->update(['is_default' => false]);
        $selected = $model::updateOrCreate(
            ['company_id' => $companyId, 'slug' => $slug],
            ['name' => $template->name, 'is_active' => true, 'is_default' => true]
        );

        return response()->json(['data' => $selected, 'message' => 'Template activated.']);
    }
}