<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminLoginRequest;
use App\Models\Admin;
use App\Services\Auth\JwtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function __construct(private readonly JwtService $jwtService)
    {
    }

    public function login(AdminLoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();
        $admin = Admin::query()
            ->where('email', $credentials['login'])
            ->orWhere('username', $credentials['login'])
            ->first();

        if (!$admin || !Hash::check($credentials['password'], $admin->password)) {
            return apiResponse('Invalid credentials provided.', [], 401);
        }

        if (!$admin->is_active) {
            return apiResponse('Admin account is inactive.', [], 403);
        }

        $token = $this->jwtService->createToken([
            'sub' => $admin->id,
            'role' => 'admin',
        ]);

        return apiResponse('Admin logged in successfully.', [
            'token' => $token,
            'token_type' => 'Bearer',
            'expires_in' => $this->jwtService->getTtl(),
            'admin' => $admin->only(['id', 'name', 'email', 'username']),
        ]);
    }
}
