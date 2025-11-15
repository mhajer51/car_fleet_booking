<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\HandlesAccountAuthentication;
use App\Http\Controllers\Controller;
use App\Models\Admin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    use HandlesAccountAuthentication;

    public function login(Request $request): JsonResponse
    {
        $credentials = $this->validateCredentials($request);

        $admin = $this->findAccount($credentials['login'], Admin::class);

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
}
