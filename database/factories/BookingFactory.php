<?php

namespace Database\Factories;

use App\Models\Car;
use App\Models\Driver;
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
        $end = fake()->boolean(80)
            ? (clone $start)->addHours(fake()->numberBetween(1, 6))
            : null;

        return [
            'user_id' => User::factory(),
            'car_id' => Car::factory(),
            'driver_id' => Driver::factory(),
            'price' => fake()->randomFloat(2, 80, 500),
            'start_date' => $start,
            'end_date' => $end,
            'note' => fake()->optional()->sentence(),
            'is_approved' => true,
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => ['is_approved' => false]);
    }

    public function open(): static
    {
        return $this->state(function () {
            $start = Carbon::now()->subHour();

            return [
                'start_date' => $start,
                'end_date' => null,
            ];
        });
    }

    public function upcoming(): static
    {
        return $this->state(function () {
            $start = Carbon::now()->addDay();

            return [
                'start_date' => $start,
                'end_date' => (clone $start)->addHours(2),
            ];
        });
    }

    public function active(): static
    {
        return $this->state(function () {
            $start = Carbon::now()->subHours(2);

            return [
                'start_date' => $start,
                'end_date' => Carbon::now()->addHours(2),
            ];
        });
    }

    public function completed(): static
    {
        return $this->state(function () {
            $start = Carbon::now()->subDays(2);

            return [
                'start_date' => $start,
                'end_date' => $start->clone()->addHours(4),
            ];
        });
    }
}
