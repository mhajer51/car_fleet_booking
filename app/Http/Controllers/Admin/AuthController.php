<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RefreshTokenRequest;
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

        return apiResponse('Admin logged in successfully.', $this->prepareAuthPayload($admin));
    }

    public function refresh(RefreshTokenRequest $request): JsonResponse
    {
        try {
            $payload = $this->jwtService->validateToken($request->validated('refresh_token'), 'refresh');
        } catch (\Throwable $exception) {
            return apiResponse('Unauthorized', [], 401, ['token' => $exception->getMessage()]);
        }

        if (($payload['role'] ?? null) !== 'admin') {
            return apiResponse('Unauthorized', [], 401);
        }

        /** @var Admin|null $admin */
        $admin = Admin::query()->find($payload['sub'] ?? null);

        if (!$admin || !$admin->is_active) {
            return apiResponse('Unauthorized', [], 401);
        }

        return apiResponse('Session refreshed successfully.', $this->prepareAuthPayload($admin));
    }

    private function prepareAuthPayload(Admin $admin): array
    {
        $accessToken = $this->jwtService->createAccessToken([
            'sub' => $admin->id,
            'role' => 'admin',
        ]);

        $refreshToken = $this->jwtService->createRefreshToken([
            'sub' => $admin->id,
            'role' => 'admin',
        ]);

        return [
            'token' => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer',
            'expires_in' => $this->jwtService->getTtl(),
            'refresh_expires_in' => $this->jwtService->getRefreshTtl(),
            'admin' => $admin->only(['id', 'name', 'email', 'username']),
        ];
    }
}
