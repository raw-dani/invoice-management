<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\ActivityLog;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    private function authorizeCompany(Product $product): void
    {
        if ((int) $product->company_id !== (int) auth()->user()->company_id) {
            abort(403, 'Unauthorized action.');
        }
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Product::where('company_id', auth()->user()->company_id);

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }

        $perPage = min((int) $request->input('per_page', 15), 100);

        return ProductResource::collection($query->latest()->paginate($perPage));
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $this->authorize('create', Product::class);

        $product = Product::create([
            ...$request->validated(),
            'company_id' => auth()->user()->company_id,
            'sku'        => Product::generateSku(auth()->user()->company_id),
        ]);

        ActivityLog::record('product.created', "Product {$product->name} created", $product);

        return (new ProductResource($product))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Product $product): ProductResource
    {
        $this->authorize('view', $product);

        return new ProductResource($product);
    }

    public function update(UpdateProductRequest $request, Product $product): ProductResource
    {
        $this->authorize('manage', $product);

        $product->update($request->validated());
        ActivityLog::record('product.updated', "Product {$product->name} updated", $product);

        return new ProductResource($product->fresh());
    }

    public function destroy(Product $product): JsonResponse
    {
        $this->authorize('delete', $product);

        $product->delete();
        ActivityLog::record('product.deleted', "Product {$product->name} deleted", $product);

        return response()->json(['message' => 'Product deleted.']);
    }

    public function bulkStatus(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids'    => 'required|array|min:1',
            'ids.*'  => 'integer',
            'status' => 'required|in:active,inactive',
        ]);

        $companyId = auth()->user()->company_id;
        $processed = 0;

        DB::transaction(function () use ($data, $companyId, &$processed) {
            $products = Product::where('company_id', $companyId)->whereIn('id', $data['ids'])->get();
            foreach ($products as $product) {
                $product->update(['status' => $data['status']]);
                ActivityLog::record('product.status_updated', "Product {$product->name} marked {$data['status']}", $product);
                $processed++;
            }
        });

        $failed = count($data['ids']) - $processed;

        return response()->json([
            'data'    => ['processed' => $processed, 'failed' => $failed],
            'message' => "{$processed} product(s) updated.",
        ]);
    }
}

