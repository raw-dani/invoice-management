<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ImportExportController extends Controller
{
    /**
     * Download CSV template for customer or product import.
     */
    public function downloadTemplate(string $type): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"template_import_{$type}.csv\"",
        ];

        return response()->stream(function () use ($type) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF)); // BOM for Excel UTF-8

            if ($type === 'customers') {
                fputcsv($handle, ['company_name', 'contact_name', 'email', 'phone', 'address', 'city', 'tax_number', 'credit_limit']);
                fputcsv($handle, ['PT Contoh Sukses', 'Budi Santoso', 'budi@contoh.com', '08123456789', 'Jl. Sudirman No 1', 'Jakarta', '01.234.567.8-001.000', '50000000']);
            } elseif ($type === 'products') {
                fputcsv($handle, ['name', 'sku', 'description', 'price', 'cost_price', 'unit']);
                fputcsv($handle, ['Jasa Pembuatan Website', 'WEB-DEV-01', 'Pengembangan web korporat', '15000000', '5000000', 'proyek']);
            }

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Import customers from uploaded CSV file.
     */
    public function importCustomers(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
        ]);

        $companyId = auth()->user()->company_id;
        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');

        $header = fgetcsv($handle);
        if (!$header) {
            fclose($handle);
            return response()->json(['success' => false, 'message' => 'File CSV kosong.'], 422);
        }

        // Clean BOM
        $header[0] = preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $header[0]);

        $imported = 0;
        $skipped = 0;

        while (($row = fgetcsv($handle)) !== false) {
            if (empty(array_filter($row))) continue;

            $data = array_combine(array_slice($header, 0, count($row)), $row);

            $companyName = trim($data['company_name'] ?? '');
            if (!$companyName) {
                $skipped++;
                continue;
            }

            Customer::create([
                'company_id' => $companyId,
                'customer_number' => Customer::generateCustomerNumber($companyId),
                'company_name' => $companyName,
                'contact_name' => trim($data['contact_name'] ?? ''),
                'email' => trim($data['email'] ?? null) ?: null,
                'phone' => trim($data['phone'] ?? null) ?: null,
                'address' => trim($data['address'] ?? null) ?: null,
                'city' => trim($data['city'] ?? null) ?: null,
                'tax_number' => trim($data['tax_number'] ?? null) ?: null,
                'credit_limit' => !empty($data['credit_limit']) ? (float)$data['credit_limit'] : 0,
                'status' => 'active',
            ]);

            $imported++;
        }

        fclose($handle);

        return response()->json([
            'success' => true,
            'message' => "Berhasil mengimpor {$imported} data pelanggan. ({$skipped} dilewati)",
            'imported' => $imported,
            'skipped' => $skipped,
        ]);
    }

    /**
     * Import products from uploaded CSV file.
     */
    public function importProducts(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
        ]);

        $companyId = auth()->user()->company_id;
        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');

        $header = fgetcsv($handle);
        if (!$header) {
            fclose($handle);
            return response()->json(['success' => false, 'message' => 'File CSV kosong.'], 422);
        }

        $header[0] = preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $header[0]);

        $imported = 0;
        $skipped = 0;

        while (($row = fgetcsv($handle)) !== false) {
            if (empty(array_filter($row))) continue;

            $data = array_combine(array_slice($header, 0, count($row)), $row);

            $name = trim($data['name'] ?? '');
            if (!$name) {
                $skipped++;
                continue;
            }

            Product::create([
                'company_id' => $companyId,
                'name' => $name,
                'sku' => trim($data['sku'] ?? null) ?: Product::generateSku($companyId),
                'description' => trim($data['description'] ?? null) ?: null,
                'price' => (float)($data['price'] ?? 0),
                'cost_price' => (float)($data['cost_price'] ?? 0),
                'unit' => trim($data['unit'] ?? 'pcs'),
                'is_active' => true,
            ]);

            $imported++;
        }

        fclose($handle);

        return response()->json([
            'success' => true,
            'message' => "Berhasil mengimpor {$imported} data produk. ({$skipped} dilewati)",
            'imported' => $imported,
            'skipped' => $skipped,
        ]);
    }
}
