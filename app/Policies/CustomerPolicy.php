<?php

namespace App\Policies;

use App\Models\User;

class CustomerPolicy extends CompanyOwnedPolicy
{
    protected function sameCompany(User $user, $customer): bool
    {
        return (int) $user->company_id === (int) $customer->company_id;
    }
}
