<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Quote;
use App\Models\QuoteMilestone;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class KillerFeaturesTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $demoUser;
    private Company $company;
    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'name' => 'PT Solusi Hebat',
            'email' => 'info@solusihebat.com',
            'currency' => 'IDR',
        ]);

        $this->admin = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => 'admin',
        ]);

        $this->demoUser = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => 'demo',
        ]);

        $this->customer = Customer::create([
            'company_id' => $this->company->id,
            'customer_number' => 'CUST-001',
            'company_name' => 'PT Klien Utama',
            'contact_name' => 'Budi Pratama',
            'email' => 'budi@klien.com',
            'phone' => '08123456789',
        ]);
    }

    public function test_public_portal_invoice_view_and_proof_upload_and_approval(): void
    {
        Storage::fake('public');

        $invoice = Invoice::create([
            'company_id' => $this->company->id,
            'customer_id' => $this->customer->id,
            'invoice_number' => 'INV-2026-0001',
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
            'status' => 'sent',
            'subtotal' => 10000000,
            'tax_amount' => 0,
            'discount_amount' => 0,
            'total' => 10000000,
            'paid_amount' => 0,
            'balance' => 10000000,
        ]);

        $this->assertNotEmpty($invoice->public_token);

        // 1. Client views invoice without auth (both by token and fallback numeric ID)
        $res = $this->getJson("/api/public/invoices/{$invoice->public_token}");
        $res->assertOk()
            ->assertJsonPath('invoice.invoice_number', 'INV-2026-0001');

        $resById = $this->getJson("/api/public/invoices/{$invoice->id}");
        $resById->assertOk()
            ->assertJsonPath('invoice.invoice_number', 'INV-2026-0001');

        // Verify activity was logged
        $this->assertDatabaseHas('activity_logs', [
            'subject_type' => Invoice::class,
            'subject_id' => $invoice->id,
            'action' => 'invoice.viewed',
        ]);

        // 2. Client uploads proof of payment
        $file = UploadedFile::fake()->image('transfer_proof.jpg');
        $uploadRes = $this->postJson("/api/public/invoices/{$invoice->public_token}/proof", [
            'proof' => $file,
        ]);
        $uploadRes->assertOk();

        $invoice->refresh();
        $this->assertEquals('pending', $invoice->payment_proof_status);
        $this->assertNotNull($invoice->payment_proof_path);

        // 3. Admin approves proof of payment
        $approveRes = $this->actingAs($this->admin)->postJson("/api/invoices/{$invoice->id}/approve-proof");
        $approveRes->assertOk();

        $invoice->refresh();
        $this->assertEquals('approved', $invoice->payment_proof_status);
        $this->assertEquals('paid', $invoice->status);
        $this->assertEquals(10000000, (float) $invoice->paid_amount);
        $this->assertEquals(0, (float) $invoice->balance);
    }

    public function test_public_portal_quote_view_and_approval(): void
    {
        $quote = Quote::create([
            'company_id' => $this->company->id,
            'customer_id' => $this->customer->id,
            'quote_number' => 'QUO-2026-0001',
            'quote_date' => now()->toDateString(),
            'valid_until' => now()->addDays(30)->toDateString(),
            'status' => 'sent',
            'subtotal' => 5000000,
            'tax_amount' => 0,
            'discount_amount' => 0,
            'total' => 5000000,
        ]);

        $this->assertNotEmpty($quote->public_token);

        // 1. Client views quote without auth (both by token and fallback numeric ID)
        $res = $this->getJson("/api/public/quotes/{$quote->public_token}");
        $res->assertOk()
            ->assertJsonPath('quote.quote_number', 'QUO-2026-0001');

        $resById = $this->getJson("/api/public/quotes/{$quote->id}");
        $resById->assertOk()
            ->assertJsonPath('quote.quote_number', 'QUO-2026-0001');

        $this->assertEquals('viewed', $quote->fresh()->status);

        // 2. Client approves quote
        $acceptRes = $this->postJson("/api/public/quotes/{$quote->public_token}/accept", [
            'notes' => 'Disetujui untuk dikerjakan segera',
        ]);
        $acceptRes->assertOk();

        $this->assertEquals('accepted', $quote->fresh()->status);
    }

    public function test_milestones_and_termin_invoice_generation(): void
    {
        $quote = Quote::create([
            'company_id' => $this->company->id,
            'customer_id' => $this->customer->id,
            'quote_number' => 'QUO-2026-0002',
            'quote_date' => now()->toDateString(),
            'valid_until' => now()->addDays(30)->toDateString(),
            'status' => 'accepted',
            'subtotal' => 20000000,
            'tax_amount' => 0,
            'discount_amount' => 0,
            'total' => 20000000,
        ]);

        // 1. Save milestones (DP 50% & Pelunasan 50%)
        $saveMilestonesRes = $this->actingAs($this->admin)->postJson("/api/quotes/{$quote->id}/milestones", [
            'milestones' => [
                [
                    'name' => 'Termin 1 (DP 50%)',
                    'sequence' => 1,
                    'percentage' => 50,
                    'amount' => 10000000,
                    'status' => 'pending',
                ],
                [
                    'name' => 'Termin 2 (Pelunasan 50%)',
                    'sequence' => 2,
                    'percentage' => 50,
                    'amount' => 10000000,
                    'status' => 'pending',
                ],
            ],
        ]);
        $saveMilestonesRes->assertOk();

        $this->assertCount(2, QuoteMilestone::where('quote_id', $quote->id)->get());
        $milestone1 = QuoteMilestone::where('quote_id', $quote->id)->where('sequence', 1)->first();

        // 2. Generate invoice for Milestone 1
        $genRes = $this->actingAs($this->admin)->postJson("/api/quotes/{$quote->id}/milestones/{$milestone1->id}/generate-invoice");
        $genRes->assertCreated();

        $milestone1->refresh();
        $this->assertEquals('invoiced', $milestone1->status);
        $this->assertNotNull($milestone1->invoice_id);

        $invoice = Invoice::find($milestone1->invoice_id);
        $this->assertNotNull($invoice);
        $this->assertEquals(10000000, (float) $invoice->total);
        $this->assertEquals(1, $invoice->milestone_sequence);
        $this->assertEquals(2, $invoice->milestone_total_termins);
        $this->assertEquals('Termin 1 (DP 50%)', $invoice->milestone_name);
    }

    public function test_ar_aging_report_endpoint(): void
    {
        // Invoice current (due in 5 days)
        Invoice::create([
            'company_id' => $this->company->id,
            'customer_id' => $this->customer->id,
            'invoice_number' => 'INV-CURRENT',
            'invoice_date' => now()->subDays(5)->toDateString(),
            'due_date' => now()->addDays(5)->toDateString(),
            'status' => 'sent',
            'subtotal' => 1000000,
            'tax_amount' => 0,
            'discount_amount' => 0,
            'total' => 1000000,
            'paid_amount' => 0,
            'balance' => 1000000,
        ]);

        // Invoice overdue 10 days (1-30 bracket)
        Invoice::create([
            'company_id' => $this->company->id,
            'customer_id' => $this->customer->id,
            'invoice_number' => 'INV-OVERDUE-10',
            'invoice_date' => now()->subDays(20)->toDateString(),
            'due_date' => now()->subDays(10)->toDateString(),
            'status' => 'sent',
            'subtotal' => 2000000,
            'tax_amount' => 0,
            'discount_amount' => 0,
            'total' => 2000000,
            'paid_amount' => 0,
            'balance' => 2000000,
        ]);

        $res = $this->actingAs($this->admin)->getJson('/api/reports/ar-aging');
        $res->assertOk();

        $summary = $res->json('data.summary');
        $this->assertEquals(3000000, (float) $summary['total_receivables']);
        $this->assertEquals(1000000, (float) $summary['current']);
        $this->assertEquals(2000000, (float) $summary['days_1_30']);
        $this->assertEquals(2, $summary['invoice_count']);
        $this->assertEquals(1, $summary['customer_count']);
    }

    public function test_demo_role_restrictions(): void
    {
        // Demo user cannot create other users
        $res = $this->actingAs($this->demoUser)->postJson('/api/users', [
            'name' => 'New User',
            'email' => 'newuser@solusihebat.com',
            'role' => 'staff',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);
        $res->assertForbidden();

        // Demo user cannot update settings
        $settingsRes = $this->actingAs($this->demoUser)->putJson('/api/settings/company', [
            'company_name' => 'Hacked Company Name',
        ]);
        $settingsRes->assertForbidden();

        // Demo user CAN view invoices & reports
        $invRes = $this->actingAs($this->demoUser)->getJson('/api/invoices');
        $invRes->assertOk();

        $repRes = $this->actingAs($this->demoUser)->getJson('/api/reports/ar-aging');
        $repRes->assertOk();
    }
}
