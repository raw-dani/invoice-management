<?php

namespace App\Console\Commands;

use App\Jobs\SendPaymentReminder;
use App\Models\Invoice;
use App\Models\Setting;
use Illuminate\Console\Command;

class SendReminders extends Command
{
    protected $signature = 'reminders:send {--dry-run : Show what would be sent without dispatching}';

    protected $description = 'Send payment reminders (3 days before due, on due date, 3 days after = overdue, 7 days after = final overdue) and mark overdue invoices';

    public function handle(): int
    {
        $today = now()->startOfDay();
        $dispatched = 0;
        $markedOverdue = 0;

        // 1. Mark sent/partially_paid invoices past due date as overdue.
        $markedOverdue = Invoice::whereIn('status', ['sent', 'partially_paid'])
            ->whereDate('due_date', '<', $today)
            ->update(['status' => 'overdue']);

        // 2. Determine enabled reminder types per company via settings.
        $companies = \App\Models\Company::pluck('id');
        foreach ($companies as $companyId) {
            $enabled = static function (string $key) use ($companyId): bool {
                $value = Setting::getValue($companyId, $key, '1');
                return $value === null || $value === '' || $value === '1';
            };

            $wantsDueSoon = $enabled('reminder_due_soon_enabled');   // 3 days before due
            $wantsDueDate = $enabled('reminder_due_date_enabled');   // on due date
            $wantsOverdue = $enabled('reminder_overdue_enabled');    // 3 days after due
            $wantsFinal   = $enabled('reminder_final_enabled');      // 7 days after due

            $send = function (string $kind, array $invoices) use (&$dispatched, $companyId): void {
                foreach ($invoices as $invoice) {
                    if ($this->option('dry-run')) {
                        $this->line("[dry-run] {$kind}: invoice {$invoice->invoice_number} (company {$companyId})");
                        $dispatched++;
                        continue;
                    }
                    SendPaymentReminder::dispatch($invoice->id, $kind);
                    $dispatched++;
                }
            };

            // 3. Reminders for invoices with outstanding balance.
            $base = fn () => Invoice::whereIn('status', ['sent', 'partially_paid'])
                ->where('company_id', $companyId)
                ->where('balance', '>', 0)
                ->whereNotNull('due_date');

            if ($wantsDueSoon) {
                $send('reminder', $base()->whereDate('due_date', $today->copy()->addDays(3))->get()->all());
            }
            if ($wantsDueDate) {
                $send('reminder', $base()->whereDate('due_date', $today)->get()->all());
            }
            if ($wantsOverdue) {
                $send('overdue', $base()->whereIn('status', ['overdue'])->whereDate('due_date', $today->copy()->subDays(3))->get()->all());
            }
            if ($wantsFinal) {
                $send('overdue', $base()->whereIn('status', ['overdue'])->whereDate('due_date', $today->copy()->subDays(7))->get()->all());
            }
        }

        $this->info("Reminders: {$dispatched} email(s) dispatched, {$markedOverdue} invoice(s) marked overdue.");

        return self::SUCCESS;
    }
}
