<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

class NotifyUser
{
    public function send(User $user, string $type, string $title, string $body, array $data = []): Notification
    {
        return Notification::create([
            'company_id' => $user->company_id,
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'data' => $data,
        ]);
    }

    public function company(string $companyId, string $type, string $title, string $body, array $data = []): void
    {
        User::where('company_id', $companyId)->each(fn (User $user) => $this->send($user, $type, $title, $body, $data));
    }
}