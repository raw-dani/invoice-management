<?php

namespace App\Providers;

// use Illuminate\Support\Facades\Gate;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        \App\Models\Customer::class     => \App\Policies\CustomerPolicy::class,
        \App\Models\Product::class      => \App\Policies\ProductPolicy::class,
        \App\Models\Invoice::class      => \App\Policies\InvoicePolicy::class,
        \App\Models\Quote::class        => \App\Policies\QuotePolicy::class,
        \App\Models\Payment::class      => \App\Policies\PaymentPolicy::class,
        \App\Models\Subscription::class => \App\Policies\SubscriptionPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        //
    }
}
