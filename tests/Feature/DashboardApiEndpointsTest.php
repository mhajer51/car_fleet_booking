<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Car;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class DashboardApiEndpointsTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_endpoint_returns_status(): void
    {
        $response = $this->getJson('/api/health?role=portal');

        $response->assertOk()
            ->assertJsonStructure(['ok', 'role', 'latency', 'refreshedAt'])
            ->assertJson(['role' => 'portal', 'ok' => true]);
    }

    public function test_admin_overview_returns_structured_payload(): void
    {
        $user = User::factory()->create();
        $car = Car::factory()->create();
        Booking::factory()->create([
            'user_id' => $user->id,
            'car_id' => $car->id,
            'status' => BookingStatus::ACTIVE,
        ]);

        $response = $this->getJson('/api/admin/overview');

        $response->assertOk()
            ->assertJsonStructure([
                'metrics',
                'activity',
                'split' => ['ready', 'enRoute', 'maintenance'],
                'highlights',
            ]);

        $this->assertNotEmpty($response->json('metrics'));
    }

    public function test_portal_overview_returns_live_dashboard_data(): void
    {
        $user = User::factory()->create();
        $car = Car::factory()->create();
        Carbon::setTestNow('2024-05-05 09:00:00');

        Booking::factory()->create([
            'user_id' => $user->id,
            'car_id' => $car->id,
            'start_date' => now()->subHour(),
            'end_date' => now()->addHour(),
            'status' => BookingStatus::ACTIVE,
        ]);

        $response = $this->getJson('/api/portal/overview');

        $response->assertOk()
            ->assertJsonStructure([
                'metrics',
                'timeline',
                'suggestions',
                'heatmap',
            ]);

        $this->assertNotEmpty($response->json('timeline'));
        Carbon::setTestNow();
    }
}
