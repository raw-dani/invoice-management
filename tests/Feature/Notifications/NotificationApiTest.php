<?php

namespace Tests\Feature\Notifications;

use App\Models\Company;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_list_only_their_company_notifications(): void
    {
        $company = Company::create(['name' => 'Acme']);
        $otherCompany = Company::create(['name' => 'Other']);
        $user = User::factory()->create(['company_id' => $company->id, 'role' => 'owner']);
        $otherUser = User::factory()->create(['company_id' => $otherCompany->id, 'role' => 'owner']);

        Notification::create([
            'company_id' => $company->id, 'user_id' => $user->id,
            'type' => 'payment_received', 'title' => 'Payment received', 'body' => 'Visible',
        ]);
        Notification::create([
            'company_id' => $otherCompany->id, 'user_id' => $otherUser->id,
            'type' => 'payment_received', 'title' => 'Other notification', 'body' => 'Hidden',
        ]);

        Sanctum::actingAs($user);
        $response = $this->getJson('/api/notifications');

        $response->assertOk()->assertJsonCount(1, 'data.data');
        $response->assertJsonPath('data.data.0.title', 'Payment received');
        $response->assertJsonPath('unread_count', 1);
    }

    public function test_user_can_mark_notification_read_and_mark_all_read(): void
    {
        $company = Company::create(['name' => 'Acme']);
        $user = User::factory()->create(['company_id' => $company->id, 'role' => 'owner']);
        $notifications = collect([1, 2])->map(fn () => Notification::create([
            'company_id' => $company->id,
            'user_id' => $user->id,
            'type' => 'invoice_paid',
            'title' => 'Invoice paid',
            'body' => 'Done',
        ]));

        Sanctum::actingAs($user);
        $this->postJson("/api/notifications/{$notifications->first()->id}/read")
            ->assertOk();
        $this->assertNotNull($notifications->first()->fresh()->read_at);

        $this->postJson('/api/notifications/read-all')->assertOk();
        $this->assertSame(0, Notification::where('user_id', $user->id)->whereNull('read_at')->count());
    }
}