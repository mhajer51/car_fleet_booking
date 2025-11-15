<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Car;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class BookingApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_booking_via_api(): void
    {
        $user = User::factory()->create();
        $car = Car::factory()->create();

        $payload = [
            'user_id' => $user->id,
            'car_id' => $car->id,
            'start_date' => '2024-05-01 09:00:00',
            'end_date' => '2024-05-01 10:00:00',
        ];

        $response = $this->postJson('/api/bookings', $payload);

        $response->assertCreated()
            ->assertJsonFragment(['message' => 'Car booked successfully.']);

        $this->assertDatabaseHas('bookings', [
            'user_id' => $user->id,
            'car_id' => $car->id,
            'status' => BookingStatus::ACTIVE->value,
        ]);
    }

    public function test_return_endpoint_closes_booking(): void
    {
        $booking = Booking::factory()->open()->create([
            'status' => BookingStatus::ACTIVE,
        ]);

        Carbon::setTestNow('2024-05-02 12:00:00');

        $response = $this->postJson("/api/bookings/{$booking->id}/return");

        $response->assertOk()
            ->assertJsonFragment(['message' => 'Booking closed successfully.']);

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => BookingStatus::CLOSED->value,
        ]);

        Carbon::setTestNow();
    }
}
