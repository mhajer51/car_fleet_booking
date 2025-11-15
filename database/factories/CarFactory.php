<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Car>
 */
class CarFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->company().' '.fake()->word(),
            'model' => fake()->year(),
            'color' => fake()->safeColorName(),
            'number' => strtoupper(fake()->unique()->bothify('??##??')),
            'is_active' => true,
        ];
    }
}
