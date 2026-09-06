<?php

namespace Tests\Feature\Quotes;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Quote;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class QuoteApiTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private User $user;
    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->company = Company::create(['name' => 'Acme']);
        $this->user = User::factory()->create(['company_id' => $this->company->id, 'role' => 'owner']);
        $this->customer = Customer::create([
            'company_id' => $this->company->id,
            'company_name' => 'PT Client',
            'status' => 'active',
        ]);
        Sanctum::actingAs($this->user);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'customer_id' => $this->customer->id,
            'quote_date' => now()->toDateString(),
            'currency' => 'IDR',
            'discount' => 0,
            'discount_type' => 0,
            'tax_rate' => 0,
            'items' => [
                ['description' => 'Hosting', 'quantity' => 1, 'unit_price' => 5000000],
            ],
        ], $overrides);
    }

    private function createDraftQuote(): Quote
    {
        $response = $this->postJson('/api/quotes', $this->payload());
        $response->assertCreated();

        return Quote::latest('id')->first();
    }

    public function test_create_quote_calculates_total_and_number(): void
    {
        $quote = $this->createDraftQuote();

        $this->assertEquals(5000000, (float) $quote->total);
        $this->assertSame('draft', $quote->status);
        $this->assertStringStartsWith('QT-', $quote->quote_number);
    }

    public function test_send_accept_then_convert_to_invoice(): void
    {
        $quote = $this->createDraftQuote();

        $this->postJson("/api/quotes/{$quote->id}/send")->assertOk();
        $this->assertSame('sent', $quote->fresh()->status);

        $this->postJson("/api/quotes/{$quote->id}/accept")->assertOk();
        $this->assertSame('accepted', $quote->fresh()->status);

        $response = $this->postJson("/api/quotes/{$quote->id}/convert-to-invoice");
        $response->assertCreated();
        $invoiceId = $response->json('data.id');

        $this->assertSame('converted', $quote->fresh()->status);
        $this->assertEquals($quote->id, \App\Models\Invoice::find($invoiceId)->quote_id);
        $this->assertEquals(5000000, (float) \App\Models\Invoice::find($invoiceId)->total);
    }

    public function test_reject_quote_then_cannot_accept(): void
    {
        $quote = $this->createDraftQuote();
        $this->postJson("/api/quotes/{$quote->id}/send")->assertOk();
        $this->postJson("/api/quotes/{$quote->id}/reject")->assertOk();
        $this->assertSame('rejected', $quote->fresh()->status);

        $this->postJson("/api/quotes/{$quote->id}/accept")->assertStatus(422);
    }

    public function test_duplicate_quote_creates_new_draft(): void
    {
        $quote = $this->createDraftQuote();
        $this->postJson("/api/quotes/{$quote->id}/send")->assertOk();

        $response = $this->postJson("/api/quotes/{$quote->id}/duplicate");
        $response->assertCreated();
        $copyId = $response->json('data.id');

        $copy = Quote::find($copyId);
        $this->assertNotSame($quote->id, $copy->id);
        $this->assertNotSame($quote->quote_number, $copy->quote_number);
        $this->assertSame('draft', $copy->status);
        $this->assertEquals(5000000, (float) $copy->total);
        $this->assertCount(1, $copy->items);
    }
}
