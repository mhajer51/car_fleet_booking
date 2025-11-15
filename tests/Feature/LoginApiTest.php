<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_with_username(): void
    {
        $user = User::factory()->create();

        $response = $this->postJson(route('api.user.login'), [
            'login' => $user->username,
            'password' => 'password',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'User logged in successfully.')
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonStructure([
                'data' => [
                    'token',
                    'token_type',
                    'expires_in',
                    'user' => ['id', 'name', 'email', 'username', 'employee_number'],
                ],
            ]);
    }

    public function test_admin_can_login_with_email(): void
    {
        $admin = Admin::factory()->create();

        $response = $this->postJson(route('api.admin.login'), [
            'login' => $admin->email,
            'password' => 'password',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Admin logged in successfully.')
            ->assertJsonPath('data.admin.id', $admin->id)
            ->assertJsonStructure([
                'data' => [
                    'token',
                    'token_type',
                    'expires_in',
                    'admin' => ['id', 'name', 'email', 'username'],
                ],
            ]);
    }

    public function test_user_cannot_login_with_invalid_credentials(): void
    {
        $user = User::factory()->create();

        $response = $this->postJson(route('api.user.login'), [
            'login' => $user->username,
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401)->assertJsonPath('message', 'Invalid credentials provided.');
    }

    public function test_inactive_accounts_are_rejected(): void
    {
        $user = User::factory()->create(['is_active' => false]);
        $admin = Admin::factory()->create(['is_active' => false]);

        $this->postJson(route('api.user.login'), [
            'login' => $user->username,
            'password' => 'password',
        ])->assertStatus(403)->assertJsonPath('message', 'User account is inactive.');

        $this->postJson(route('api.admin.login'), [
            'login' => $admin->username,
            'password' => 'password',
        ])->assertStatus(403)->assertJsonPath('message', 'Admin account is inactive.');
    }
}
