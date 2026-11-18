<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\CreditNote;
use App\Models\Customer;
use App\Models\DebitNote;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreditNoteAndStatementTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Company $company;
    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'name' => 'PT Sumber Rejeki',
            'email' => 'admin@rejeki.com',
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
            'customer_number' => 'CUST-00001',
            'company_name' => 'PT Klien Utama',
            'email' => 'finance@klienutama.com',
        ]);
    }

    public function test_can_create_credit_note_and_auto_allocate_to_invoice(): void
    {
        $invoice = Invoice::create([
            'company_id' => $this->company->id,
            'customer_id' => $this->customer->id,
            'invoice_number' => 'INV-2026-00001',
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'status' => 'sent',
            'subtotal' => 1000000,
            'tax_rate' => 0,
            'tax_amount' => 0,
            'total' => 1000000,
            'paid_amount' => 0,
            'balance' => 1000000,
            'currency' => 'IDR',
        ]);

        $payload = [
            'customer_id' => $this->customer->id,
            'invoice_id' => $invoice->id,
            'credit_note_date' => now()->toDateString(),
            'reason' => 'Retur barang cacat',
            'items' => [
                [
                    'description' => 'Penyesuaian Barang Cacat',
                    'quantity' => 1,
                    'unit_price' => 300000,
                    'tax_rate' => 0,
                ],
            ],
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/credit-notes', $payload);

        $response->assertCreated();
        $response->assertJsonPath('success', true);
        $this->assertEquals(0, (float)$response->json('data.remaining_balance'));
        $this->assertEquals('applied', $response->json('data.status'));

        $invoice->refresh();
        $this->assertEquals(700000, (float)$invoice->balance);
        $this->assertEquals('partially_paid', $invoice->status);
    }

    public function test_customer_statement_aggregates_running_balance(): void
    {
        $inv = Invoice::create([
            'company_id' => $this->company->id,
            'customer_id' => $this->customer->id,
            'invoice_number' => 'INV-2026-00002',
            'invoice_date' => '2026-01-10',
            'due_date' => '2026-02-10',
            'status' => 'sent',
            'subtotal' => 500000,
            'total' => 500000,
            'balance' => 500000,
            'currency' => 'IDR',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/customers/{$this->customer->id}/statement?start_date=2026-01-01&end_date=2026-12-31");

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.closing_balance', 500000);
        $response->assertJsonCount(1, 'data.transactions');
    }
}
