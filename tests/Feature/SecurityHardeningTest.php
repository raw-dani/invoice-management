<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Invoice;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SecurityHardeningTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        $this->company = Company::create(['name' => 'PT Solusi Hebat']);

        $this->admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@solusihebat.com',
            'password' => Hash::make('password123'),
            'company_id' => $this->company->id,
            'role' => 'admin',
        ]);
    }

    public function test_security_headers_are_present_in_responses(): void
    {
        $response = $this->get('/api/health');
        $response->assertOk();

        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
        $response->assertHeader('X-XSS-Protection', '1; mode=block');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    public function test_svg_upload_is_rejected_for_company_logo(): void
    {
        $svgFile = UploadedFile::fake()->createWithContent(
            'malicious.svg',
            '<svg xmlns="http://www.w3.org/2000/svg"><script>alert("xss")</script></svg>'
        );

        $response = $this->actingAs($this->admin)->postJson('/api/company/logo', [
            'logo' => $svgFile,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['logo']);
    }

    public function test_safe_png_upload_is_accepted_for_company_logo(): void
    {
        $pngFile = UploadedFile::fake()->image('valid_logo.png', 100, 100);

        $response = $this->actingAs($this->admin)->postJson('/api/company/logo', [
            'logo' => $pngFile,
        ]);

        $response->assertOk();
        $this->company->refresh();
        $this->assertNotNull($this->company->logo);
        Storage::disk('public')->assertExists($this->company->logo);
    }

    public function test_public_registration_is_blocked(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Attacker',
            'email' => 'attacker@evil.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'company_name' => 'Evil Corp',
        ]);

        $response->assertStatus(403);
    }

    public function test_midtrans_webhook_rejects_forged_signature_when_configured(): void
    {
        $customer = \App\Models\Customer::create([
            'company_id' => $this->company->id,
            'company_name' => 'PT Pelanggan Aman',
            'email' => 'pelanggan@aman.com',
        ]);

        Setting::create([
            'company_id' => $this->company->id,
            'key' => 'midtrans_server_key',
            'value' => 'secret_midtrans_key_123',
        ]);

        $invoice = Invoice::create([
            'company_id' => $this->company->id,
            'customer_id' => $customer->id,
            'invoice_number' => 'INV-SEC-001',
            'status' => 'sent',
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(7)->toDateString(),
            'currency' => 'IDR',
            'subtotal' => 100000,
            'tax_total' => 0,
            'total' => 100000,
            'balance' => 100000,
            'portal_token' => 'sec-token-1',
        ]);

        $forgedPayload = [
            'order_id' => 'INV-SEC-001',
            'transaction_status' => 'settlement',
            'status_code' => '200',
            'gross_amount' => 100000,
            'signature_key' => 'fake_invalid_signature_hash',
        ];

        $response = $this->postJson('/api/webhooks/payment/midtrans', $forgedPayload);
        $response->assertStatus(403);

        $invoice->refresh();
        $this->assertEquals('sent', $invoice->status); // Still unpaid!
    }

    public function test_midtrans_webhook_accepts_valid_signature_when_configured(): void
    {
        $customer = \App\Models\Customer::create([
            'company_id' => $this->company->id,
            'company_name' => 'PT Pelanggan Aman 2',
            'email' => 'pelanggan2@aman.com',
        ]);

        $serverKey = 'secret_midtrans_key_123';
        Setting::create([
            'company_id' => $this->company->id,
            'key' => 'midtrans_server_key',
            'value' => $serverKey,
        ]);

        $invoice = Invoice::create([
            'company_id' => $this->company->id,
            'customer_id' => $customer->id,
            'invoice_number' => 'INV-SEC-002',
            'status' => 'sent',
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(7)->toDateString(),
            'currency' => 'IDR',
            'subtotal' => 200000,
            'tax_total' => 0,
            'total' => 200000,
            'balance' => 200000,
            'portal_token' => 'sec-token-2',
        ]);

        $validSignature = hash('sha512', 'INV-SEC-002' . '200' . '200000' . $serverKey);

        $validPayload = [
            'order_id' => 'INV-SEC-002',
            'transaction_status' => 'settlement',
            'fraud_status' => 'accept',
            'status_code' => '200',
            'gross_amount' => 200000,
            'signature_key' => $validSignature,
            'payment_type' => 'qris',
            'transaction_id' => 'trx-legit-999',
        ];

        $response = $this->postJson('/api/webhooks/payment/midtrans', $validPayload);
        $response->assertOk();

        $invoice->refresh();
        $this->assertEquals('paid', $invoice->status);
        $this->assertEquals(0, (float) $invoice->balance);
    }
}
