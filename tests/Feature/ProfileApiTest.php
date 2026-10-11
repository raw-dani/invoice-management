<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProfileApiTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private User $user;
    private User $admin;
    private User $demoUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create(['name' => 'PT Solusi Hebat']);

        $this->admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@solusihebat.com',
            'password' => Hash::make('password123'),
            'company_id' => $this->company->id,
            'role' => 'admin',
        ]);

        $this->user = User::create([
            'name' => 'Staff User',
            'email' => 'staff@solusihebat.com',
            'password' => Hash::make('password123'),
            'company_id' => $this->company->id,
            'role' => 'staff',
        ]);

        $this->demoUser = User::create([
            'name' => 'Demo User',
            'email' => 'demo@solusihebat.com',
            'password' => Hash::make('demo1234'),
            'company_id' => $this->company->id,
            'role' => 'demo',
        ]);
    }

    public function test_user_can_view_profile(): void
    {
        $res = $this->actingAs($this->user)->getJson('/api/profile');
        $res->assertOk();
        $res->assertJsonPath('data.name', 'Staff User');
        $res->assertJsonPath('data.email', 'staff@solusihebat.com');
        $res->assertJsonPath('data.company.name', 'PT Solusi Hebat');
    }

    public function test_user_can_update_profile_info(): void
    {
        $res = $this->actingAs($this->user)->putJson('/api/profile', [
            'name' => 'Staff Diperbarui',
            'email' => 'staff.baru@solusihebat.com',
        ]);

        $res->assertOk();
        $this->user->refresh();
        $this->assertEquals('Staff Diperbarui', $this->user->name);
        $this->assertEquals('staff.baru@solusihebat.com', $this->user->email);
    }

    public function test_user_can_change_password_independently(): void
    {
        $res = $this->actingAs($this->user)->putJson('/api/profile/password', [
            'current_password' => 'password123',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $res->assertOk();
        $this->user->refresh();
        $this->assertTrue(Hash::check('newpassword123', $this->user->password));
    }

    public function test_cannot_change_password_with_incorrect_current_password(): void
    {
        $res = $this->actingAs($this->user)->putJson('/api/profile/password', [
            'current_password' => 'wrongpassword',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $res->assertUnprocessable();
        $res->assertJsonValidationErrors(['current_password']);
    }

    public function test_cannot_change_password_with_mismatched_confirmation(): void
    {
        $res = $this->actingAs($this->user)->putJson('/api/profile/password', [
            'current_password' => 'password123',
            'password' => 'newpassword123',
            'password_confirmation' => 'mismatch123',
        ]);

        $res->assertUnprocessable();
        $res->assertJsonValidationErrors(['password']);
    }

    public function test_demo_user_cannot_update_profile_or_password(): void
    {
        $updateRes = $this->actingAs($this->demoUser)->putJson('/api/profile', [
            'name' => 'Hacked Name',
            'email' => 'hacked@solusihebat.com',
        ]);
        $updateRes->assertForbidden();

        $passRes = $this->actingAs($this->demoUser)->putJson('/api/profile/password', [
            'current_password' => 'demo1234',
            'password' => 'newdemo1234',
            'password_confirmation' => 'newdemo1234',
        ]);
        $passRes->assertForbidden();
    }

    public function test_admin_can_reset_another_users_password(): void
    {
        $res = $this->actingAs($this->admin)->putJson("/api/users/{$this->user->id}", [
            'name' => 'Staff User',
            'email' => 'staff@solusihebat.com',
            'role' => 'staff',
            'password' => 'resetbyadmin123',
            'password_confirmation' => 'resetbyadmin123',
        ]);

        $res->assertOk();
        $this->user->refresh();
        $this->assertTrue(Hash::check('resetbyadmin123', $this->user->password));
    }
}
