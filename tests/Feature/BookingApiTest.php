<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Driver;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class BookingApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_booking_via_api(): void
    {
        $this->withoutMiddleware();

        $user = User::factory()->create();
        $car = Car::factory()->create();
        $driver = Driver::factory()->create();

        $payload = [
            'user_id' => $user->id,
            'car_id' => $car->id,
            'driver_id' => $driver->id,
            'price' => 150.50,
            'start_date' => '2024-05-01 09:00:00',
            'end_date' => '2024-05-01 10:00:00',
        ];

        $response = $this->postJson('/api/user/bookings', $payload);

        $response->assertOk()
            ->assertJsonFragment(['message' => 'Car booked successfully.']);

        $this->assertDatabaseHas('bookings', [
            'user_id' => $user->id,
            'car_id' => $car->id,
            'driver_id' => $driver->id,
            'is_approved' => false,
        ]);
    }

    public function test_user_cannot_book_inactive_car(): void
    {
        $this->withoutMiddleware();

        $user = User::factory()->create();
        $inactiveCar = Car::factory()->create(['is_active' => false]);
        $driver = Driver::factory()->create();

        $payload = [
            'user_id' => $user->id,
            'car_id' => $inactiveCar->id,
            'driver_id' => $driver->id,
            'price' => 120.00,
            'start_date' => '2024-05-01 09:00:00',
            'end_date' => '2024-05-01 10:00:00',
        ];

        $response = $this->postJson('/api/user/bookings', $payload);

        $response->assertStatus(422)
            ->assertJsonFragment(['message' => 'Validation failed'])
            ->assertJsonPath('data.car_id.0', 'The selected car id is invalid.');
    }

    public function test_user_cannot_book_with_inactive_driver(): void
    {
        $this->withoutMiddleware();

        $user = User::factory()->create();
        $car = Car::factory()->create();
        $driver = Driver::factory()->create(['is_active' => false]);

        $payload = [
            'user_id' => $user->id,
            'car_id' => $car->id,
            'driver_id' => $driver->id,
            'price' => 120.00,
            'start_date' => '2024-05-01 09:00:00',
            'end_date' => '2024-05-01 10:00:00',
        ];

        $response = $this->postJson('/api/user/bookings', $payload);

        $response->assertStatus(422)
            ->assertJsonFragment(['message' => 'Validation failed'])
            ->assertJsonPath('data.driver_id.0', 'The selected driver id is invalid.');
    }

    public function test_return_endpoint_closes_booking(): void
    {
        $this->withoutMiddleware();

        $booking = Booking::factory()->open()->create();

        Carbon::setTestNow('2024-05-02 12:00:00');

        $response = $this->postJson("/api/user/bookings/{$booking->id}/return");

        $response->assertOk()
            ->assertJsonFragment(['message' => 'Booking closed successfully.']);

        $booking->refresh();
        $this->assertEquals(BookingStatus::COMPLETED, $booking->status);
        $this->assertNotNull($booking->end_date);

        Carbon::setTestNow();
    }
}
