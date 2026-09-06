<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Quote;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $term = trim((string) $request->input('q'));
        abort_if(strlen($term) < 2, 422, 'Search query must be at least 2 characters.');
        $companyId = auth()->user()->company_id;
        $like = "%{$term}%";

        return response()->json(['data' => [
            'customers' => Customer::where('company_id', $companyId)->where(fn ($q) => $q->where('company_name', 'like', $like)->orWhere('email', 'like', $like)->orWhere('customer_number', 'like', $like))->limit(5)->get(['id', 'customer_number', 'company_name', 'email']),
            'products' => Product::where('company_id', $companyId)->where(fn ($q) => $q->where('name', 'like', $like)->orWhere('sku', 'like', $like))->limit(5)->get(['id', 'sku', 'name', 'type']),
            'invoices' => Invoice::with('customer:id,company_name')->where('company_id', $companyId)->where('invoice_number', 'like', $like)->limit(5)->get(['id', 'invoice_number', 'status', 'total', 'currency', 'customer_id']),
            'quotes' => Quote::with('customer:id,company_name')->where('company_id', $companyId)->where('quote_number', 'like', $like)->limit(5)->get(['id', 'quote_number', 'status', 'total', 'currency', 'customer_id']),
            'subscriptions' => Subscription::with('customer:id,company_name')->where('company_id', $companyId)->where('subscription_number', 'like', $like)->limit(5)->get(['id', 'subscription_number', 'status', 'next_billing_date', 'customer_id']),
        ]]);
    }
}