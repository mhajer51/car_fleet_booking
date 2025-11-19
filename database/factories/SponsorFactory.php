<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Sponsor>
 */
class SponsorFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => fake()->company(),
            'traffic_file_number' => strtoupper(fake()->unique()->bothify('TFN-####')),
            'is_active' => true,
        ];
    }
}
