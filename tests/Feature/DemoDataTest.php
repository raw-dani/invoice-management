<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Quote;
use App\Models\Subscription;
use App\Models\User;
use App\Services\DemoDataService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DemoDataTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private User $owner;
    private User $staff;
    private User $viewer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'name' => 'Original Corp',
            'email' => 'corp@example.com',
        ]);

        $this->owner = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => 'owner',
            'is_demo' => false,
        ]);

        $this->staff = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => 'staff',
            'is_demo' => false,
        ]);

        $this->viewer = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => 'viewer',
            'is_demo' => false,
        ]);
    }

    public function test_service_generates_complete_demo_data(): void
    {
        $service = new DemoDataService();
        $stats = $service->generate($this->company, $this->owner);

        $this->assertTrue($stats['has_demo_data']);
        $this->assertGreaterThan(0, $stats['counts']['customers']);
        $this->assertGreaterThan(0, $stats['counts']['products']);
        $this->assertGreaterThan(0, $stats['counts']['invoices']);
        $this->assertGreaterThan(0, $stats['counts']['quotes']);
        $this->assertGreaterThan(0, $stats['counts']['payments']);
        $this->assertGreaterThan(0, $stats['counts']['subscriptions']);

        // Verify records have is_demo = true
        $this->assertTrue(Customer::where('company_id', $this->company->id)->where('is_demo', true)->exists());
        $this->assertTrue(Invoice::where('company_id', $this->company->id)->where('is_demo', true)->exists());
        $this->assertTrue(Quote::where('company_id', $this->company->id)->where('is_demo', true)->exists());
        $this->assertTrue(Payment::where('company_id', $this->company->id)->where('is_demo', true)->exists());
        $this->assertTrue(Subscription::where('company_id', $this->company->id)->where('is_demo', true)->exists());
    }

    public function test_only_admin_can_access_and_clear_demo_data_api(): void
    {
        $service = new DemoDataService();
        $service->generate($this->company, $this->owner);

        // 1. Staff cannot clear demo data (403 Forbidden)
        Sanctum::actingAs($this->staff);
        $responseStaff = $this->postJson('/api/settings/demo-data/clear');
        $responseStaff->assertStatus(403);

        // 2. Viewer cannot clear demo data (403 Forbidden)
        Sanctum::actingAs($this->viewer);
        $responseViewer = $this->postJson('/api/settings/demo-data/clear');
        $responseViewer->assertStatus(403);

        // 3. Owner can clear demo data
        Sanctum::actingAs($this->owner);
        $responseStats = $this->getJson('/api/settings/demo-data/stats');
        $responseStats->assertOk();
        $responseStats->assertJsonPath('data.has_demo_data', true);

        $responseClear = $this->postJson('/api/settings/demo-data/clear');
        $responseClear->assertOk();
        $responseClear->assertJson(['message' => 'Data demo berhasil dihapus dari sistem.']);

        $responseStatsAfter = $this->getJson('/api/settings/demo-data/stats');
        $responseStatsAfter->assertJsonPath('data.has_demo_data', false);
    }

    public function test_clearing_demo_data_preserves_real_user_data(): void
    {
        $service = new DemoDataService();
        $service->generate($this->company, $this->owner);

        // Create a real customer and real invoice (is_demo = false)
        $realCustomer = Customer::create([
            'company_id' => $this->company->id,
            'customer_number' => 'CUST-REAL-001',
            'company_name' => 'Real Client PT',
            'is_demo' => false,
        ]);

        $realInvoice = Invoice::create([
            'company_id' => $this->company->id,
            'customer_id' => $realCustomer->id,
            'invoice_number' => 'INV-REAL-2026-9999',
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'status' => 'sent',
            'subtotal' => 10000000,
            'total' => 11100000,
            'balance' => 11100000,
            'is_demo' => false,
        ]);

        // Clear demo data
        $service->clear($this->company);

        // Verify demo records are removed
        $this->assertEquals(0, Invoice::where('company_id', $this->company->id)->where('is_demo', true)->count());
        $this->assertEquals(0, Customer::where('company_id', $this->company->id)->where('is_demo', true)->count());

        // Verify real customer and invoice remain untouched!
        $this->assertDatabaseHas('customers', [
            'id' => $realCustomer->id,
            'customer_number' => 'CUST-REAL-001',
            'is_demo' => false,
        ]);
        $this->assertDatabaseHas('invoices', [
            'id' => $realInvoice->id,
            'invoice_number' => 'INV-REAL-2026-9999',
            'is_demo' => false,
        ]);
    }

    public function test_artisan_commands_seed_and_clear_demo_data(): void
    {
        $exitCodeSeed = Artisan::call('demo:seed', ['--company' => $this->company->id]);
        $this->assertEquals(0, $exitCodeSeed);
        $this->assertTrue(Invoice::where('company_id', $this->company->id)->where('is_demo', true)->exists());

        $exitCodeClear = Artisan::call('demo:clear', ['--company' => $this->company->id]);
        $this->assertEquals(0, $exitCodeClear);
        $this->assertFalse(Invoice::where('company_id', $this->company->id)->where('is_demo', true)->exists());
    }
}
