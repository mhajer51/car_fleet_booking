<?php

namespace Database\Factories;

use App\Models\Driver;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Driver>
 */
class DriverFactory extends Factory
{
    protected $model = Driver::class;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'license_number' => strtoupper(fake()->unique()->bothify('DRV-####')),
            'phone_number' => fake()->unique()->numerify('9715#######'),
            'is_active' => true,
        ];
    }
}
