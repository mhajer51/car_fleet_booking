<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Exceptions\BookingConflictException;
use App\Models\Booking;
use App\Models\Car;
use App\Models\User;
use App\Services\Bookings\BookingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class BookingServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_a_booking_when_car_is_available(): void
    {
        $service = app(BookingService::class);
        $user = User::factory()->create();
        $car = Car::factory()->create();

        $booking = $service->create(
            $user,
            $car,
            Carbon::parse('2024-05-01 09:00:00'),
            Carbon::parse('2024-05-01 11:00:00')
        );

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
        ]);
    }

    public function test_it_prevents_overlapping_bookings(): void
    {
        $service = app(BookingService::class);
        $user = User::factory()->create();
        $car = Car::factory()->create();

        Booking::factory()->create([
            'user_id' => $user->id,
            'car_id' => $car->id,
            'start_date' => Carbon::parse('2024-05-01 10:00:00'),
            'end_date' => Carbon::parse('2024-05-01 12:00:00'),
        ]);

        $this->expectException(BookingConflictException::class);

        $service->create(
            $user,
            $car,
            Carbon::parse('2024-05-01 11:00:00'),
            Carbon::parse('2024-05-01 13:00:00')
        );
    }

    public function test_it_closes_an_active_booking(): void
    {
        $service = app(BookingService::class);
        $booking = Booking::factory()->open()->create();

        $closed = $service->close($booking);

        $this->assertEquals(BookingStatus::COMPLETED, $closed->status);
        $this->assertNotNull($closed->end_date);
    }
}
