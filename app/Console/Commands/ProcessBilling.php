<?php

namespace App\Console\Commands;

use App\Jobs\GenerateRecurringInvoice;
use App\Models\BillingSchedule;
use App\Models\Subscription;
use Carbon\Carbon;
use Illuminate\Console\Command;

class ProcessBilling extends Command
{
    protected $signature = 'billing:process {--date= : Process billing as of YYYY-MM-DD}';

    protected $description = 'Queue invoices for subscriptions that are due';

    public function handle(): int
    {
        $date = $this->option('date')
            ? Carbon::createFromFormat('Y-m-d', $this->option('date'))->startOfDay()
            : today();

        $queued = 0;
        Subscription::where('status', 'active')
            ->whereDate('next_billing_date', '<=', $date)
            ->where(function ($query) use ($date) {
                $query->whereNull('end_date')->orWhereDate('end_date', '>=', $date);
            })
            ->chunkById(100, function ($subscriptions) use ($date, &$queued) {
                foreach ($subscriptions as $subscription) {
                    $schedule = BillingSchedule::firstOrCreate([
                        'subscription_id' => $subscription->id,
                        'billing_date' => $subscription->next_billing_date,
                    ], [
                        'company_id' => $subscription->company_id,
                        'status' => 'pending',
                    ]);

                    if (in_array($schedule->status, ['completed', 'processing'], true)) {
                        continue;
                    }

                    GenerateRecurringInvoice::dispatch($schedule->id);
                    $queued++;
                }
            });

        $this->info("Queued {$queued} recurring invoice job(s) as of {$date->toDateString()}.");

        return self::SUCCESS;
    }
}