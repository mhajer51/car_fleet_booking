<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Car;
use App\Models\User;
use App\Enums\BookingStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_displays_dashboard_metrics(): void
    {
        $user = User::factory()->create();
        $car = Car::factory()->create();
        Booking::factory()->create([
            'user_id' => $user->id,
            'car_id' => $car->id,
        ]);

        $response = $this->get('/admin');

        $response->assertOk();
        $response->assertSee((string) User::count());
        $response->assertSee((string) Car::count());
        $activeCount = Booking::query()->approved()->status(BookingStatus::ACTIVE)->count();
        $response->assertSee((string) $activeCount);
    }

    public function test_it_creates_users_from_dashboard(): void
    {
        $payload = [
            'name' => 'Test User',
            'username' => 'test-user',
            'email' => 'test@example.com',
            'employee_number' => 'EMP9999',
            'password' => 'password123',
            'is_active' => 1,
        ];

        $response = $this->post('/admin/users', $payload);

        $response->assertRedirect(route('admin.dashboard'));
        $this->assertDatabaseHas('users', [
            'username' => 'test-user',
        ]);
    }

    public function test_it_creates_cars_from_dashboard(): void
    {
        $payload = [
            'name' => 'SUV',
            'model' => '2024',
            'color' => 'Black',
            'number' => 'XYZ-999',
            'is_active' => 1,
        ];

        $response = $this->post('/admin/cars', $payload);

        $response->assertRedirect(route('admin.dashboard'));
        $this->assertDatabaseHas('cars', [
            'number' => 'XYZ-999',
        ]);
    }
}
