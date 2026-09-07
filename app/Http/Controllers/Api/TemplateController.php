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