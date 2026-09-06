<?php

namespace App\Policies;

use App\Models\User;

class ProductPolicy extends CompanyOwnedPolicy
{
    protected function sameCompany(User $user, $product): bool
    {
        return (int) $user->company_id === (int) $product->company_id;
    }
}
