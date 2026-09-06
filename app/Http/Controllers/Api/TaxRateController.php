<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TaxRate;
use Illuminate\Http\JsonResponse;

class TaxRateController extends Controller
{
    public function index(): JsonResponse
    {
        $companyId = auth()->user()->company_id;
        $rates = TaxRate::where('is_active', true)
            ->where(fn ($query) => $query->whereNull('company_id')->orWhere('company_id', $companyId))
            ->orderByDesc('is_default')->orderBy('rate')->get()
            ->map(fn (TaxRate $tax) => [
                'id' => $tax->id,
                'name' => $tax->name,
                'rate' => (float) $tax->rate,
                'is_default' => $tax->is_default,
            ]);

        return response()->json(['data' => $rates->values()]);
    }
}