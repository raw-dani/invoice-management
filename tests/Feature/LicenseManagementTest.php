<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LicenseManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $viewer;
    private Company $company;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'name' => 'PT Invoice Testing',
            'email' => 'admin@invoicetest.com',
            'currency' => 'IDR',
        ]);

        $this->admin = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => 'admin',
        ]);

        $this->viewer = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => 'viewer',
        ]);
    }

    public function test_license_status_endpoint_returns_valid_structure(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/settings/license/status');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'is_licensed',
                    'status',
                    'status_message',
                    'license_key',
                    'masked_license_key',
                    'expires_at',
                    'last_checked',
                    'server_url',
                    'api_key',
                    'current_domain',
                    'install_id',
                    'fingerprint',
                    'grace_period_hours',
                    'device_info' => [
                        'hostname',
                        'os',
                        'php_version',
                        'server_ip',
                        'app_root',
                    ],
                ],
            ]);

        $this->assertNotEmpty($response->json('data.install_id'));
    }

    public function test_license_activate_validation(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/settings/license/activate', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['license_key']);
    }

    public function test_viewer_cannot_activate_or_revoke_license(): void
    {
        $activate = $this->actingAs($this->viewer, 'sanctum')
            ->postJson('/api/settings/license/activate', [
                'license_key' => 'INVOICE-TEST-1234-5678-ABCD',
            ]);

        $activate->assertStatus(403);

        $revoke = $this->actingAs($this->viewer, 'sanctum')
            ->postJson('/api/settings/license/revoke');

        $revoke->assertStatus(403);
    }

    public function test_revoke_license_endpoint(): void
    {
        $guard = app(\App\Services\LicenseService::class)->getGuard($this->company->id);
        $guard->writeStorageData([
            'license_key' => 'INVOICE-TEST-1234-5678-ABCD',
            'token' => 'dummy_token',
            'install_id' => 'dummy_id',
            'domain' => 'localhost',
            'expires_at' => null,
            'last_checked' => time(),
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/settings/license/revoke');

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Lisensi berhasil dicabut.',
            ]);

        $this->assertEmpty($guard->readStorageData());

        $status = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/settings/license/status');

        $status->assertStatus(200)
            ->assertJsonPath('data.is_licensed', false);
    }
}
