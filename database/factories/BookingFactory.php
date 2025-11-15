<?php

namespace Database\Factories;

use App\Enums\BookingStatus;
use App\Models\Car;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<\App\Models\Booking>
 */
class BookingFactory extends Factory
{
    public function definition(): array
    {
        $start = Carbon::instance(fake()->dateTimeBetween('-1 week', '+1 week'));
        $end = (clone $start)->addHours(fake()->numberBetween(1, 6));

        return [
            'user_id' => User::factory(),
            'car_id' => Car::factory(),
            'start_date' => $start,
            'end_date' => $end,
            'status' => BookingStatus::ACTIVE,
        ];
    }

    public function open(): static
    {
        return $this->state(fn () => ['end_date' => null]);
    }

    public function closed(): static
    {
        return $this->state(fn () => ['status' => BookingStatus::CLOSED]);
    }
}
