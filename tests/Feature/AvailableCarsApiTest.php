<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Car;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AvailableCarsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_returns_cars_based_on_requested_dates(): void
    {
        $car = Car::factory()->create();
        $user = User::factory()->create();

        Booking::factory()->create([
            'car_id' => $car->id,
            'user_id' => $user->id,
            'start_date' => '2024-10-10 09:00:00',
            'end_date' => '2024-10-12 10:00:00',
            'status' => BookingStatus::ACTIVE,
        ]);

        $this->withoutMiddleware();

        $beforeWindow = $this->getJson('/api/user/cars/available', [
            'start_date' => '2024-10-01 08:00:00',
            'end_date' => '2024-10-05 18:00:00',
        ]);

        $beforeWindow->assertOk()
            ->assertJsonFragment(['id' => $car->id]);

        $overlappingWindow = $this->getJson('/api/user/cars/available', [
            'start_date' => '2024-10-11 08:00:00',
            'end_date' => '2024-10-11 12:00:00',
        ]);

        $overlappingWindow->assertOk()
            ->assertJsonMissing(['id' => $car->id]);
    }

    public function test_start_date_is_required_for_availability_check(): void
    {
        $this->withoutMiddleware();

        $this->getJson('/api/user/cars/available')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['start_date']);
    }
}
