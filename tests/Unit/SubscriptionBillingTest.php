<?php

namespace Tests\Unit;

use App\Models\Subscription;
use Carbon\Carbon;
use Tests\TestCase;

class SubscriptionBillingTest extends TestCase
{
    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_monthly_billing_date_advances_without_overflow(): void
    {
        $subscription = new Subscription([
            'billing_cycle' => 'monthly',
            'next_billing_date' => '2026-01-31',
        ]);

        $subscription->advanceBillingDate();

        $this->assertSame('2026-02-28', $subscription->next_billing_date->toDateString());
    }

    /** @dataProvider billingCycles */
    public function test_billing_date_advances_for_each_cycle(string $cycle, string $expected): void
    {
        $subscription = new Subscription([
            'billing_cycle' => $cycle,
            'next_billing_date' => '2026-01-15',
        ]);

        $subscription->advanceBillingDate();

        $this->assertSame($expected, $subscription->next_billing_date->toDateString());
    }

    public static function billingCycles(): array
    {
        return [
            'monthly' => ['monthly', '2026-02-15'],
            'quarterly' => ['quarterly', '2026-04-15'],
            'semi annual' => ['semi_annual', '2026-07-15'],
            'yearly' => ['yearly', '2027-01-15'],
        ];
    }
}