<?php

namespace App\Policies;

use App\Models\User;

class InvoicePolicy extends CompanyOwnedPolicy
{
    protected function sameCompany(User $user, $invoice): bool
    {
        return (int) $user->company_id === (int) $invoice->company_id;
    }
}
