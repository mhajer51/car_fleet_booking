<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\Car;
use App\Models\Sponsor;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        Admin::factory()->create([
            'name' => 'Super Admin',
            'username' => 'admin',
            'email' => 'fleet-admin@example.com',
            "password" => Hash::make("123qwe!@£QWE"),
        ]);

        User::factory()->create([
            'name' => 'Fleet User',
            'username' => 'user',
            'email' => 'user@example.com',
            'employee_number' => 'EMP0001',
            "password" => Hash::make("123qwe!@£QWE"),
        ]);

        User::factory(5)->create();

        $sponsors = Sponsor::factory(3)->create();

        Car::factory(5)->create()->each(function (Car $car) use ($sponsors) {
            if ($sponsors->isNotEmpty() && fake()->boolean(40)) {
                $car->update([
                    'is_company_owned' => false,
                    'sponsor_id' => $sponsors->random()->id,
                ]);
            }
        });
    }
}
