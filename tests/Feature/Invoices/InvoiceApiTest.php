<?php

namespace Tests\Feature\Invoices;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InvoiceApiTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private User $user;
    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->company = Company::create(['name' => 'Acme']);
        $this->user = User::factory()->create(['company_id' => $this->company->id, 'role' => 'owner']);
        $this->customer = Customer::create([
            'company_id' => $this->company->id,
            'company_name' => 'PT Client',
            'status' => 'active',
        ]);
        Sanctum::actingAs($this->user);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'customer_id' => $this->customer->id,
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'currency' => 'IDR',
            'discount' => 0,
            'discount_type' => 0,
            'tax_rate' => 0,
            'items' => [
                ['description' => 'Dev App', 'quantity' => 2, 'unit_price' => 1000000],
                ['description' => 'Support', 'quantity' => 1, 'unit_price' => 500000, 'discount' => 100000],
            ],
        ], $overrides);
    }

    public function test_create_invoice_calculates_totals(): void
    {
        $response = $this->postJson('/api/invoices', $this->payload());

        $response->assertCreated();
        $invoice = Invoice::latest('id')->first();

        // subtotal = (2×1.000.000) + (1×500.000 − 100.000) = 2.400.000
        $this->assertEquals(2400000, (float) $invoice->subtotal);
        $this->assertEquals(2400000, (float) $invoice->total);
        $this->assertEquals(2400000, (float) $invoice->balance);
        $this->assertEquals('draft', $invoice->status);
        $this->assertStringStartsWith('INV-', $invoice->invoice_number);
    }

    public function test_create_invoice_with_percentage_discount_and_tax(): void
    {
        $response = $this->postJson('/api/invoices', $this->payload([
            'discount' => 10,
            'discount_type' => 1,
            'tax_rate' => 11,
        ]));

        $response->assertCreated();
        $invoice = Invoice::latest('id')->first();

        // subtotal 2.400.000 → discount 10% = 240.000 → tax 11% dari 2.160.000 = 237.600 → total 2.397.600
        $this->assertEquals(2400000, (float) $invoice->subtotal);
        // Design: discount column stores the percentage value when discount_type = 1
        $this->assertEquals(10, (float) $invoice->discount);
        $this->assertEquals(237600, (float) $invoice->tax_amount);
        $this->assertEquals(2397600, (float) $invoice->total);
    }

    public function test_invoice_is_immutable_after_sent(): void
    {
        $invoice = Invoice::create([
            'company_id' => $this->company->id,
            'customer_id' => $this->customer->id,
            'invoice_number' => 'INV-2026-00001',
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'currency' => 'IDR',
            'status' => 'sent',
        ]);

        $this->putJson("/api/invoices/{$invoice->id}", $this->payload())
            ->assertStatus(422);
    }

    public function test_mark_as_sent_then_delete_is_rejected(): void
    {
        $invoice = Invoice::create([
            'company_id' => $this->company->id,
            'customer_id' => $this->customer->id,
            'invoice_number' => 'INV-2026-00002',
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'currency' => 'IDR',
            'status' => 'draft',
        ]);

        $this->postJson("/api/invoices/{$invoice->id}/mark-as-sent")->assertOk();
        $this->assertSame('sent', $invoice->fresh()->status);

        $this->deleteJson("/api/invoices/{$invoice->id}")->assertStatus(422);
    }

    public function test_record_partial_then_full_payment_transitions_status(): void
    {
        $invoice = Invoice::create([
            'company_id' => $this->company->id,
            'customer_id' => $this->customer->id,
            'invoice_number' => 'INV-2026-00003',
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'currency' => 'IDR',
            'status' => 'sent',
            'total' => 1000000,
            'balance' => 1000000,
        ]);

        // Partial payment
        $this->postJson("/api/invoices/{$invoice->id}/payments", [
            'payment_date' => now()->toDateString(),
            'amount' => 400000,
            'currency' => 'IDR',
            'payment_method' => 'bank_transfer',
        ])->assertCreated();

        $invoice->refresh();
        $this->assertEquals(400000, (float) $invoice->paid_amount);
        $this->assertEquals(600000, (float) $invoice->balance);
        $this->assertSame('partially_paid', $invoice->status);

        // Overpayment rejected
        $this->postJson("/api/invoices/{$invoice->id}/payments", [
            'payment_date' => now()->toDateString(),
            'amount' => 999999,
            'currency' => 'IDR',
            'payment_method' => 'cash',
        ])->assertStatus(422);

        // Full payment
        $this->postJson("/api/invoices/{$invoice->id}/payments", [
            'payment_date' => now()->toDateString(),
            'amount' => 600000,
            'currency' => 'IDR',
            'payment_method' => 'cash',
        ])->assertCreated();

        $invoice->refresh();
        $this->assertEquals(0, (float) $invoice->balance);
        $this->assertSame('paid', $invoice->status);
    }

    public function test_cannot_access_other_company_invoice(): void
    {
        $otherCompany = Company::create(['name' => 'Other']);
        $otherCustomer = Customer::create(['company_id' => $otherCompany->id, 'company_name' => 'X', 'status' => 'active']);
        $invoice = Invoice::create([
            'company_id' => $otherCompany->id,
            'customer_id' => $otherCustomer->id,
            'invoice_number' => 'INV-2026-99999',
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'currency' => 'IDR',
            'status' => 'draft',
        ]);

        $this->getJson("/api/invoices/{$invoice->id}")->assertStatus(403);
    }
}
