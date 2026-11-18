<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class ApprovalAndImportTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private User $staff;
    private Company $company;
    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'name' => 'PT Megah Abadi',
            'email' => 'admin@megah.com',
            'phone' => '08123456789',
            'address' => 'Jakarta',
            'enable_invoice_approval' => true,
            'invoice_approval_threshold' => 15000000, // Rp 15.000.000
        ]);

        $this->owner = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => 'owner',
        ]);

        $this->staff = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => 'staff',
        ]);

        $this->customer = Customer::create([
            'company_id' => $this->company->id,
            'customer_number' => 'CUST-00055',
            'company_name' => 'PT Klien Korporat',
            'email' => 'finance@korporat.com',
        ]);
    }

    public function test_invoice_above_threshold_requires_manager_approval_before_sent(): void
    {
        $invoice = Invoice::create([
            'company_id' => $this->company->id,
            'customer_id' => $this->customer->id,
            'invoice_number' => 'INV-2026-00088',
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'status' => 'draft',
            'approval_status' => 'not_required',
            'subtotal' => 20000000, // 20jt > 15jt threshold
            'total' => 20000000,
            'balance' => 20000000,
            'currency' => 'IDR',
        ]);

        // 1. Staff attempts to mark as sent without approval -> blocked (422)
        $response = $this->actingAs($this->staff)
            ->postJson("/api/invoices/{$invoice->id}/mark-as-sent");
        $response->assertStatus(422);

        // 2. Staff requests approval
        $reqRes = $this->actingAs($this->staff)
            ->postJson("/api/invoices/{$invoice->id}/request-approval");
        $reqRes->assertOk();
        $this->assertEquals('pending', $invoice->fresh()->approval_status);

        // 3. Owner approves
        $appRes = $this->actingAs($this->owner)
            ->postJson("/api/invoices/{$invoice->id}/approve");
        if ($appRes->status() !== 200) {
            dump($appRes->json());
        }
        $appRes->assertOk();
        $this->assertEquals('approved', $invoice->fresh()->approval_status);

        // 4. Now staff can mark as sent
        $sentRes = $this->actingAs($this->staff)
            ->postJson("/api/invoices/{$invoice->id}/mark-as-sent");
        $sentRes->assertOk();
        $this->assertEquals('sent', $invoice->fresh()->status);
    }

    public function test_can_import_customers_from_csv(): void
    {
        $csvContent = "company_name,contact_name,email,phone,address,city,tax_number,credit_limit\n" .
                      "PT Cipta Kreasi,Hendra,hendra@cipta.com,0811223344,Jl Mawar No 10,Bandung,02.345.678.9-001.000,25000000\n";

        $file = UploadedFile::fake()->createWithContent('customers.csv', $csvContent);

        $response = $this->actingAs($this->owner)
            ->postJson('/api/import/customers', ['file' => $file]);

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('imported', 1);

        $this->assertDatabaseHas('customers', [
            'company_name' => 'PT Cipta Kreasi',
            'email' => 'hendra@cipta.com',
            'credit_limit' => 25000000,
        ]);
    }
}
