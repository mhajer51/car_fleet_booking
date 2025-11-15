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
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('message', 'User logged in successfully.');
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
            ->assertJsonPath('admin.id', $admin->id)
            ->assertJsonPath('message', 'Admin logged in successfully.');
    }

    public function test_user_cannot_login_with_invalid_credentials(): void
    {
        $user = User::factory()->create();

        $response = $this->postJson(route('api.user.login'), [
            'login' => $user->username,
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('login');
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
