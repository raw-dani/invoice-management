<?php

namespace App\Policies;

use App\Models\User;

/**
 * Shared company-scoped access logic.
 *
 * Abilities:
 *  - view:   same company (read access, including viewers)
 *  - manage: same company + role may mutate (owner/admin/staff)
 *  - delete: same company + role may delete (owner/admin)
 */
abstract class CompanyOwnedPolicy
{
    abstract protected function sameCompany(User $user, $model): bool;

    public function view(User $user, $model): bool
    {
        return $this->sameCompany($user, $model);
    }

    public function create(User $user): bool
    {
        return $user->role !== 'viewer';
    }

    public function manage(User $user, $model): bool
    {
        return $this->sameCompany($user, $model) && $user->role !== 'viewer';
    }

    public function update(User $user, $model): bool
    {
        return $this->manage($user, $model);
    }

    public function delete(User $user, $model): bool
    {
        return $this->sameCompany($user, $model) && in_array($user->role, ['owner', 'admin'], true);
    }
}
