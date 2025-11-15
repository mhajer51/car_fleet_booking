<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function loginAdmin(Request $request): JsonResponse
    {
        $credentials = $this->validateCredentials($request);

        $admin = Admin::query()
            ->where('username', $credentials['login'])
            ->orWhere('email', $credentials['login'])
            ->first();

        $this->ensureAccountIsValid($admin, $credentials['login'], $credentials['password']);

        if (! $admin->is_active) {
            return response()->json([
                'message' => 'Admin account is inactive.',
            ], 403);
        }

        return response()->json([
            'message' => 'Admin logged in successfully.',
            'admin' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'username' => $admin->username,
                'email' => $admin->email,
            ],
        ]);
    }

    public function loginUser(Request $request): JsonResponse
    {
        $credentials = $this->validateCredentials($request);

        $user = User::query()
            ->where('username', $credentials['login'])
            ->orWhere('email', $credentials['login'])
            ->first();

        $this->ensureAccountIsValid($user, $credentials['login'], $credentials['password']);

        if (! $user->is_active) {
            return response()->json([
                'message' => 'User account is inactive.',
            ], 403);
        }

        return response()->json([
            'message' => 'User logged in successfully.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'employee_number' => $user->employee_number,
            ],
        ]);
    }

    private function validateCredentials(Request $request): array
    {
        return $request->validate([
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);
    }

    private function ensureAccountIsValid($account, string $login, string $password): void
    {
        if (! $account || ! Hash::check($password, $account->password)) {
            throw ValidationException::withMessages([
                'login' => ['The provided credentials are incorrect.'],
            ]);
        }
    }
}
