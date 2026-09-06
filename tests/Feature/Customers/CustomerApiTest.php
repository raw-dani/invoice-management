<?php

namespace Tests\Feature\Customers;

use App\Models\Company;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CustomerApiTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->company = Company::create(['name' => 'Acme']);
        $this->user = User::factory()->create(['company_id' => $this->company->id, 'role' => 'owner']);
        Sanctum::actingAs($this->user);
    }

    public function test_create_customer_generates_number_and_defaults(): void
    {
        $response = $this->postJson('/api/customers', [
            'company_name' => 'PT Maju Jaya',
            'email' => 'info@majujaya.test',
            'status' => 'active',
        ]);

        $response->assertCreated();
        $customer = Customer::latest('id')->first();

        $this->assertSame('PT Maju Jaya', $customer->company_name);
        $this->assertStringStartsWith('CUST-', $customer->customer_number);
        $this->assertSame($this->company->id, $customer->company_id);
    }

    public function test_create_customer_validation_requires_company_name(): void
    {
        $this->postJson('/api/customers', ['email' => 'x@y.test'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('company_name');
    }

    public function test_update_and_delete_customer(): void
    {
        $customer = Customer::create([
            'company_id' => $this->company->id,
            'company_name' => 'PT Lama',
            'status' => 'active',
        ]);

        $this->putJson("/api/customers/{$customer->id}", ['company_name' => 'PT Baru', 'status' => 'active'])
            ->assertOk();
        $this->assertSame('PT Baru', $customer->fresh()->company_name);

        $this->deleteJson("/api/customers/{$customer->id}")->assertOk();
        $this->assertNull(Customer::find($customer->id));
    }

    public function test_list_is_scoped_to_company(): void
    {
        Customer::create(['company_id' => $this->company->id, 'company_name' => 'Mine', 'status' => 'active']);
        $other = Company::create(['name' => 'Other']);
        Customer::create(['company_id' => $other->id, 'company_name' => 'Theirs', 'status' => 'active']);

        $response = $this->getJson('/api/customers');
        $response->assertOk();
        $names = collect($response->json('data'))->pluck('company_name');
        $this->assertContains('Mine', $names);
        $this->assertNotContains('Theirs', $names);
    }

    public function test_overview_endpoint_returns_related_data(): void
    {
        $customer = Customer::create([
            'company_id' => $this->company->id,
            'company_name' => 'PT Overview',
            'status' => 'active',
        ]);

        $this->getJson("/api/customers/{$customer->id}/overview")
            ->assertOk()
            ->assertJsonStructure(['data' => ['invoices', 'quotes', 'subscriptions', 'payments', 'activity']]);
    }
}
