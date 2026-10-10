<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Quote;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SystemAuditFixTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private User $owner;
    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->company = Company::create(['name' => 'Acme Inc', 'email' => 'acme@example.com']);
        $this->owner = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => 'owner',
            'email' => 'owner@example.com',
        ]);
        $this->customer = Customer::create([
            'company_id' => $this->company->id,
            'company_name' => 'Client Corp',
            'email' => 'client@example.com',
            'status' => 'active',
        ]);
    }

    public function test_settings_email_test_route_works_without_middleware_error(): void
    {
        Sanctum::actingAs($this->owner);

        // This endpoint previously failed due to middleware('role,admin') typo
        $response = $this->postJson('/api/settings/email/test', [
            'to' => 'test@example.com',
        ]);

        // It should either succeed or fail at mail sending (422), but NOT throw 500 (Middleware not found)
        $this->assertNotEquals(500, $response->getStatusCode());
    }

    public function test_send_reminders_command_finds_overdue_invoices(): void
    {
        $invoice = Invoice::create([
            'company_id' => $this->company->id,
            'customer_id' => $this->customer->id,
            'invoice_number' => 'INV-2026-99991',
            'invoice_date' => now()->subDays(15)->toDateString(),
            'due_date' => now()->subDays(3)->toDateString(),
            'status' => 'sent',
            'total' => 500000,
            'balance' => 500000,
            'currency' => 'IDR',
            'discount_type' => 0,
        ]);

        // Run reminders:send with dry-run
        $exitCode = Artisan::call('reminders:send', ['--dry-run' => true]);
        $this->assertEquals(0, $exitCode);

        // After running, the invoice status should be marked as overdue
        $this->assertEquals('overdue', $invoice->fresh()->status);
    }

    public function test_subscription_invalid_status_change_returns_422(): void
    {
        Sanctum::actingAs($this->owner);

        $subscription = Subscription::create([
            'company_id' => $this->company->id,
            'customer_id' => $this->customer->id,
            'subscription_number' => 'SUB-2026-99991',
            'status' => 'draft',
            'billing_cycle' => 'monthly',
            'start_date' => now()->toDateString(),
            'next_billing_date' => now()->addMonth()->toDateString(),
            'currency' => 'IDR',
        ]);

        // Pausing a draft subscription is invalid (only active can be paused)
        // Previously this crashed with TypeError (500)
        $response = $this->postJson("/api/subscriptions/{$subscription->id}/pause");

        $response->assertStatus(422);
    }

    public function test_email_controller_cross_company_authorization(): void
    {
        $otherCompany = Company::create(['name' => 'Evil Corp']);
        $otherUser = User::factory()->create([
            'company_id' => $otherCompany->id,
            'role' => 'owner',
        ]);

        $invoice = Invoice::create([
            'company_id' => $this->company->id,
            'customer_id' => $this->customer->id,
            'invoice_number' => 'INV-2026-99992',
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'status' => 'sent',
            'total' => 100000,
            'balance' => 100000,
            'currency' => 'IDR',
            'discount_type' => 0,
        ]);

        // Acting as user from other company
        Sanctum::actingAs($otherUser);

        $response = $this->postJson("/api/invoices/{$invoice->id}/email");
        $response->assertStatus(403);
    }

    public function test_viewer_role_cannot_delete_or_mutate_invoices(): void
    {
        $viewer = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => 'viewer',
        ]);

        $invoice = Invoice::create([
            'company_id' => $this->company->id,
            'customer_id' => $this->customer->id,
            'invoice_number' => 'INV-2026-99993',
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'status' => 'draft',
            'total' => 100000,
            'balance' => 100000,
            'currency' => 'IDR',
            'discount_type' => 0,
        ]);

        Sanctum::actingAs($viewer);

        // Viewer should be able to view
        $viewRes = $this->getJson("/api/invoices/{$invoice->id}");
        $viewRes->assertOk();

        // But CANNOT delete (403)
        $delRes = $this->deleteJson("/api/invoices/{$invoice->id}");
        $delRes->assertStatus(403);

        // And CANNOT mark as sent (403)
        $sentRes = $this->postJson("/api/invoices/{$invoice->id}/mark-as-sent");
        $sentRes->assertStatus(403);
    }
}
