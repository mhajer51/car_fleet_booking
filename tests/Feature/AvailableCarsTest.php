<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Car;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AvailableCarsTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_returns_only_available_cars(): void
    {
        $availableCar = Car::factory()->create(['name' => 'Available Car']);
        $unavailableCar = Car::factory()->create(['name' => 'Booked Car']);

        Booking::factory()->create([
            'car_id' => $unavailableCar->id,
            'status' => BookingStatus::ACTIVE,
        ]);

        $response = $this->getJson('/api/cars/available');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['name' => 'Available Car'])
            ->assertJsonMissing(['name' => 'Booked Car']);
    }
}
