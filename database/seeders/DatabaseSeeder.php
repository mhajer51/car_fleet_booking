<?php

namespace Database\Seeders;

use App\Models\Car;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::factory()->admin()->create([
            'name' => 'Fleet Admin',
            'username' => 'admin',
            'email' => 'admin@example.com',
            'employee_number' => 'EMP0001',
        ]);

        User::factory(5)->create();

        Car::factory(5)->create();
    }
}
