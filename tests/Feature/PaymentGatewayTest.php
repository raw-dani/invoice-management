<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentGatewayTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Company $company;
    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'name' => 'PT Gateway Multi',
            'email' => 'finance@gatewaymulti.com',
            'currency' => 'IDR',
        ]);

        $this->admin = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => 'admin',
        ]);

        $this->customer = Customer::create([
            'company_id' => $this->company->id,
            'customer_number' => 'CUST-GW-01',
            'company_name' => 'PT Pelanggan Gateway',
            'contact_name' => 'Andi Wijaya',
            'email' => 'andi@pelanggan.com',
        ]);
    }

    public function test_can_save_and_retrieve_payment_gateway_settings(): void
    {
        $payload = [
            'active_gateway' => 'midtrans',
            'bank_name' => 'BCA',
            'account_name' => 'PT Gateway Multi',
            'account_number' => '88800112233',
            'instructions' => 'Sertakan nomor invoice pada berita transfer',
            'midtrans_enabled' => '1',
            'midtrans_mode' => 'sandbox',
            'midtrans_merchant_id' => 'M123456',
            'midtrans_client_key' => 'SB-Mid-client-xxx',
            'midtrans_server_key' => 'SB-Mid-server-yyy',
            'xendit_enabled' => '1',
            'xendit_mode' => 'sandbox',
            'xendit_secret_key' => 'xnd_development_secret',
            'doku_enabled' => '1',
            'doku_mode' => 'sandbox',
            'doku_client_id' => 'MALL_12345',
            'doku_secret_key' => 'SK_doku_secret',
            'duitku_enabled' => '1',
            'duitku_mode' => 'sandbox',
            'duitku_merchant_code' => 'D1234',
            'duitku_api_key' => 'APIKEY_duitku',
        ];

        $response = $this->actingAs($this->admin)
            ->putJson('/api/settings/payment', $payload);

        $response->assertOk();

        $getResponse = $this->actingAs($this->admin)
            ->getJson('/api/settings/payment');

        $getResponse->assertOk();
        $getResponse->assertJsonFragment([
            'active_gateway' => 'midtrans',
            'midtrans_merchant_id' => 'M123456',
            'xendit_secret_key' => 'xnd_development_secret',
            'doku_client_id' => 'MALL_12345',
            'duitku_merchant_code' => 'D1234',
        ]);
    }

    public function test_midtrans_webhook_processes_payment_successfully(): void
    {
        $invoice = Invoice::create([
            'company_id' => $this->company->id,
            'customer_id' => $this->customer->id,
            'invoice_number' => 'INV-2026-001',
            'status' => 'sent',
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
            'currency' => 'IDR',
            'subtotal' => 500000,
            'tax_total' => 0,
            'total' => 500000,
            'balance' => 500000,
            'portal_token' => 'token-inv-001',
        ]);

        $webhookPayload = [
            'order_id' => 'INV-2026-001',
            'transaction_status' => 'settlement',
            'fraud_status' => 'accept',
            'gross_amount' => 500000,
            'payment_type' => 'qris',
            'transaction_id' => 'trx-midtrans-12345',
        ];

        $response = $this->postJson('/api/webhooks/payment/midtrans', $webhookPayload);

        $response->assertOk();
        $invoice->refresh();

        $this->assertEquals('paid', $invoice->status);
        $this->assertEquals(0, (float) $invoice->balance);
        $this->assertDatabaseHas('payments', [
            'invoice_id' => $invoice->id,
            'amount' => 500000,
            'payment_method' => 'e_wallet',
        ]);
    }

    public function test_xendit_webhook_processes_payment_successfully(): void
    {
        $invoice = Invoice::create([
            'company_id' => $this->company->id,
            'customer_id' => $this->customer->id,
            'invoice_number' => 'INV-2026-002',
            'status' => 'sent',
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
            'currency' => 'IDR',
            'subtotal' => 750000,
            'tax_total' => 0,
            'total' => 750000,
            'balance' => 750000,
            'portal_token' => 'token-inv-002',
        ]);

        $webhookPayload = [
            'id' => 'xendit-inv-9988',
            'external_id' => 'INV-2026-002',
            'status' => 'PAID',
            'paid_amount' => 750000,
            'payment_method' => 'BANK_TRANSFER',
        ];

        $response = $this->postJson('/api/webhooks/payment/xendit', $webhookPayload);

        $response->assertOk();
        $invoice->refresh();

        $this->assertEquals('paid', $invoice->status);
        $this->assertEquals(0, (float) $invoice->balance);
        $this->assertDatabaseHas('payments', [
            'invoice_id' => $invoice->id,
            'amount' => 750000,
        ]);
    }

    public function test_doku_webhook_processes_payment_successfully(): void
    {
        $invoice = Invoice::create([
            'company_id' => $this->company->id,
            'customer_id' => $this->customer->id,
            'invoice_number' => 'INV-2026-003',
            'status' => 'sent',
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
            'currency' => 'IDR',
            'subtotal' => 1200000,
            'tax_total' => 0,
            'total' => 1200000,
            'balance' => 1200000,
            'portal_token' => 'token-inv-003',
        ]);

        $webhookPayload = [
            'order' => [
                'invoice_number' => 'INV-2026-003',
                'amount' => 1200000,
            ],
            'transaction' => [
                'status' => 'SUCCESS',
                'id' => 'doku-trx-8822',
            ],
            'channel' => [
                'id' => 'VIRTUAL_ACCOUNT_BCA',
            ],
        ];

        $response = $this->postJson('/api/webhooks/payment/doku', $webhookPayload);

        $response->assertOk();
        $invoice->refresh();

        $this->assertEquals('paid', $invoice->status);
        $this->assertEquals(0, (float) $invoice->balance);
        $this->assertDatabaseHas('payments', [
            'invoice_id' => $invoice->id,
            'amount' => 1200000,
        ]);
    }

    public function test_duitku_webhook_processes_payment_successfully(): void
    {
        $invoice = Invoice::create([
            'company_id' => $this->company->id,
            'customer_id' => $this->customer->id,
            'invoice_number' => 'INV-2026-004',
            'status' => 'sent',
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
            'currency' => 'IDR',
            'subtotal' => 350000,
            'tax_total' => 0,
            'total' => 350000,
            'balance' => 350000,
            'portal_token' => 'token-inv-004',
        ]);

        $webhookPayload = [
            'merchantOrderId' => 'INV-2026-004',
            'resultCode' => '00',
            'amount' => 350000,
            'paymentCode' => 'VA_MANDIRI',
            'reference' => 'duitku-ref-7744',
        ];

        $response = $this->postJson('/api/webhooks/payment/duitku', $webhookPayload);

        $response->assertOk();
        $invoice->refresh();

        $this->assertEquals('paid', $invoice->status);
        $this->assertEquals(0, (float) $invoice->balance);
        $this->assertDatabaseHas('payments', [
            'invoice_id' => $invoice->id,
            'amount' => 350000,
        ]);
    }
}
