<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MultiInvoicePaymentAndWithholdingTaxTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Company $company;
    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'name' => 'PT Mitra Sejahtera',
            'email' => 'admin@mitra.com',
            'phone' => '08123456789',
            'address' => 'Jakarta',
            'tax_number' => '01.234.567.8-999.000',
        ]);

        $this->user = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => 'admin',
        ]);

        $this->customer = Customer::create([
            'company_id' => $this->company->id,
            'customer_number' => 'CUST-00009',
            'company_name' => 'PT Pelanggan Prioritas',
            'email' => 'finance@prioritas.com',
        ]);
    }

    public function test_can_create_invoice_with_indonesian_withholding_tax_pph23(): void
    {
        $payload = [
            'customer_id' => $this->customer->id,
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'currency' => 'IDR',
            'discount' => 0,
            'discount_type' => 0,
            'tax_rate' => 11, // PPN 11%
            'withholding_tax_type' => 'pph_23',
            'withholding_tax_rate' => 2, // PPh 23 2%
            'withholding_tax_slip_number' => 'BP-2026-001',
            'items' => [
                [
                    'description' => 'Jasa Konsultasi IT',
                    'quantity' => 1,
                    'unit_price' => 10000000,
                    'tax_rate' => 11,
                ],
            ],
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/invoices', $payload);

        $response->assertCreated();
        $invoice = Invoice::latest()->first();

        $this->assertEquals(10000000, (float)$invoice->subtotal);
        $this->assertEquals(1100000, (float)$invoice->tax_amount);
        $this->assertEquals(11100000, (float)$invoice->total);
        $this->assertEquals('pph_23', $invoice->withholding_tax_type);
        $this->assertEquals(2, (float)$invoice->withholding_tax_rate);
        $this->assertEquals(200000, (float)$invoice->withholding_tax_amount); // 2% of 10.000.000
    }

    public function test_multi_invoice_payment_allocates_across_invoices_and_saves_overpayment_as_credit(): void
    {
        $inv1 = Invoice::create([
            'company_id' => $this->company->id,
            'customer_id' => $this->customer->id,
            'invoice_number' => 'INV-2026-00010',
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'status' => 'sent',
            'subtotal' => 3000000,
            'total' => 3000000,
            'balance' => 3000000,
            'currency' => 'IDR',
        ]);

        $inv2 = Invoice::create([
            'company_id' => $this->company->id,
            'customer_id' => $this->customer->id,
            'invoice_number' => 'INV-2026-00011',
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'status' => 'sent',
            'subtotal' => 2000000,
            'total' => 2000000,
            'balance' => 2000000,
            'currency' => 'IDR',
        ]);

        // Client pays 6.000.000 (pays inv1 3jt, inv2 2jt, and 1jt overpayment credit deposit)
        $payload = [
            'customer_id' => $this->customer->id,
            'amount' => 6000000,
            'payment_date' => now()->toDateString(),
            'payment_method' => 'bank_transfer',
            'reference' => 'TRF-BCA-987654',
            'allocations' => [
                ['invoice_id' => $inv1->id, 'amount' => 3000000],
                ['invoice_id' => $inv2->id, 'amount' => 2000000],
            ],
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/payments/multi', $payload);

        $response->assertCreated();
        $response->assertJsonPath('success', true);

        $inv1->refresh();
        $inv2->refresh();
        $this->assertEquals(0, (float)$inv1->balance);
        $this->assertEquals('paid', $inv1->status);
        $this->assertEquals(0, (float)$inv2->balance);
        $this->assertEquals('paid', $inv2->status);

        $this->customer->refresh();
        // 1.000.000 sisa lebih bayar disimpan sebagai deposit kredit pelanggan
        $this->assertEquals(1000000, (float)$this->customer->credit_balance);
    }
}
