<?php

namespace Tests\Feature;

use App\Models\CollectionTask;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CollectionOpsTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Company $company;
    private Customer $customer;
    private Invoice $invoice;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'name' => 'PT Solusi Finance',
            'email' => 'admin@solusifinance.com',
            'phone' => '08123456789',
            'address' => 'Jakarta',
        ]);

        $this->user = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => 'staff',
        ]);

        $this->customer = Customer::create([
            'company_id' => $this->company->id,
            'customer_number' => 'CUST-00999',
            'company_name' => 'PT Debitur Menunggak',
            'email' => 'finance@debitur.com',
            'phone' => '081987654321',
        ]);

        $this->invoice = Invoice::create([
            'company_id' => $this->company->id,
            'customer_id' => $this->customer->id,
            'invoice_number' => 'INV-2026-99999',
            'invoice_date' => now()->subDays(45)->toDateString(),
            'due_date' => now()->subDays(15)->toDateString(),
            'status' => 'overdue',
            'subtotal' => 8000000,
            'total' => 8000000,
            'balance' => 8000000,
            'currency' => 'IDR',
        ]);
    }

    public function test_can_create_collection_task_and_record_ptp_call_log(): void
    {
        // 1. Create collection task
        $taskRes = $this->actingAs($this->user)
            ->postJson('/api/collections/tasks', [
                'customer_id' => $this->customer->id,
                'invoice_id' => $this->invoice->id,
                'due_date' => now()->toDateString(),
                'priority' => 'urgent',
                'notes' => 'Invoice tertunggak 15 hari, hubungi Pak Joko.',
            ]);

        $taskRes->assertCreated();
        $taskId = $taskRes->json('data.id');

        // 2. Collector logs call with Promise to Pay (PTP)
        $logRes = $this->actingAs($this->user)
            ->postJson('/api/collections/logs', [
                'collection_task_id' => $taskId,
                'customer_id' => $this->customer->id,
                'invoice_id' => $this->invoice->id,
                'channel' => 'phone',
                'contact_person' => 'Pak Joko (Finance)',
                'outcome' => 'connected_ptp',
                'promise_to_pay_date' => now()->addDays(3)->toDateString(),
                'promise_to_pay_amount' => 8000000,
                'notes' => 'Klien berjanji transfer lunas hari Jumat ini setelah pencairan termin.',
            ]);

        $logRes->assertCreated();
        $this->assertDatabaseHas('collection_logs', [
            'outcome' => 'connected_ptp',
            'promise_to_pay_amount' => 8000000,
        ]);

        // Task status should transition to completed on PTP
        $task = CollectionTask::find($taskId);
        $this->assertEquals('completed', $task->status);
    }
}
