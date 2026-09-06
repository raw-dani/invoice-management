<?php

namespace App\Jobs;

use App\Models\BillingSchedule;
use App\Models\Invoice;
use App\Models\Subscription;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GenerateRecurringInvoice implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(public int $billingScheduleId)
    {
    }

    public function backoff(): array
    {
        return [60, 300, 900];
    }

    public function handle(): void
    {
        $claimed = BillingSchedule::whereKey($this->billingScheduleId)
            ->whereIn('status', ['pending', 'failed'])
            ->update([
                'status' => 'processing',
                'error_message' => null,
            ]);

        if ($claimed === 0) {
            return;
        }

        $schedule = BillingSchedule::with('subscription.items')
            ->find($this->billingScheduleId);

        if (!$schedule || $schedule->status === 'completed') {
            return;
        }

        $subscription = $schedule->subscription;
        if (!$subscription || $subscription->status !== 'active') {
            $schedule->update([
                'status' => 'skipped',
                'processed_at' => now(),
                'error_message' => 'Subscription is not active.',
            ]);
            return;
        }

        try {
            $invoice = DB::transaction(function () use ($schedule, $subscription): Invoice {
                $invoice = Invoice::create([
                    'company_id' => $subscription->company_id,
                    'customer_id' => $subscription->customer_id,
                    'subscription_id' => $subscription->id,
                    'invoice_number' => Invoice::generateInvoiceNumber($subscription->company_id),
                    'invoice_date' => $schedule->billing_date,
                    'due_date' => $schedule->billing_date->copy()->addDays($subscription->invoice_due_days),
                    'status' => 'sent',
                    'currency' => $subscription->currency,
                    'discount' => 0,
                    'discount_type' => 0,
                    'tax_rate' => 0,
                    'notes' => $subscription->notes,
                ]);

                foreach ($subscription->items as $item) {
                    $invoice->items()->create([
                        'product_id' => $item->product_id,
                        'description' => $item->description,
                        'quantity' => $item->quantity,
                        'unit_price' => $item->unit_price,
                        'discount' => $item->discount,
                        'tax_rate' => $item->tax_rate,
                    ]);
                }

                $invoice->load('items');
                $invoice->calculateTotals();

                $subscription->advanceBillingDate();
                if ($subscription->end_date && $subscription->next_billing_date->gt($subscription->end_date)) {
                    $subscription->status = 'expired';
                }
                $subscription->save();

                $schedule->update([
                    'status' => 'completed',
                    'invoice_id' => $invoice->id,
                    'processed_at' => now(),
                ]);

                return $invoice;
            });

            SendInvoiceEmail::dispatch($invoice->id);
        } catch (\Throwable $exception) {
            $schedule->update([
                'status' => 'failed',
                'error_message' => $exception->getMessage(),
            ]);
            Log::error('GenerateRecurringInvoice failed', [
                'billing_schedule_id' => $schedule->id,
                'subscription_id' => $subscription->id,
                'error' => $exception->getMessage(),
            ]);

            throw $exception;
        }
    }
}