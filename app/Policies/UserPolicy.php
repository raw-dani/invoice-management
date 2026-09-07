<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy extends CompanyOwnedPolicy
{
    protected function sameCompany(User $user, $model): bool
    {
        return (int) $user->company_id === (int) $model->company_id;
    }
}
