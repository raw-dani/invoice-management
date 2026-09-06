<?php

namespace App\Policies;

use App\Models\User;

class SubscriptionPolicy extends CompanyOwnedPolicy
{
    protected function sameCompany(User $user, $subscription): bool
    {
        return (int) $user->company_id === (int) $subscription->company_id;
    }
}
