<?php

namespace App\Policies;

use App\Models\User;

class QuotePolicy extends CompanyOwnedPolicy
{
    protected function sameCompany(User $user, $quote): bool
    {
        return (int) $user->company_id === (int) $quote->company_id;
    }
}
