<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Car;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class AvailableCarsTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_returns_only_available_cars(): void
    {
        Carbon::setTestNow('2024-05-05 09:00:00');
        $availableCar = Car::factory()->create(['name' => 'Available Car']);
        $unavailableCar = Car::factory()->create(['name' => 'Booked Car']);

        Booking::factory()->create([
            'car_id' => $unavailableCar->id,
            'start_date' => Carbon::now()->subHour(),
            'end_date' => Carbon::now()->addHours(2),
        ]);

        $response = $this->getJson('/api/cars/available');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['name' => 'Available Car'])
            ->assertJsonMissing(['name' => 'Booked Car']);

        Carbon::setTestNow();
    }
}
