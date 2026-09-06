<?php

namespace App\Policies;

use App\Models\User;

class PaymentPolicy extends CompanyOwnedPolicy
{
    protected function sameCompany(User $user, $payment): bool
    {
        return (int) $user->company_id === (int) $payment->company_id;
    }
}
