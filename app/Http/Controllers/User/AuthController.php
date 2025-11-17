<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RefreshTokenRequest;
use App\Http\Requests\User\UserLoginRequest;
use App\Models\User;
use App\Services\Auth\JwtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function __construct(private readonly JwtService $jwtService)
    {
    }

    public function login(UserLoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();
        $user = User::query()
            ->where('email', $credentials['login'])
            ->orWhere('username', $credentials['login'])
            ->orWhere('employee_number', $credentials['login'])
            ->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return apiResponse('Invalid credentials provided.', [], 401);
        }

        if (!$user->is_active) {
            return apiResponse('User account is inactive.', [], 403);
        }

        return apiResponse('User logged in successfully.', $this->prepareAuthPayload($user));
    }

    public function refresh(RefreshTokenRequest $request): JsonResponse
    {
        try {
            $payload = $this->jwtService->validateToken($request->validated('refresh_token'), 'refresh');
        } catch (\Throwable $exception) {
            return apiResponse('Unauthorized', [], 401, ['token' => $exception->getMessage()]);
        }

        if (($payload['role'] ?? null) !== 'user') {
            return apiResponse('Unauthorized', [], 401);
        }

        /** @var User|null $user */
        $user = User::query()->find($payload['sub'] ?? null);

        if (!$user || !$user->is_active) {
            return apiResponse('Unauthorized', [], 401);
        }

        return apiResponse('Session refreshed successfully.', $this->prepareAuthPayload($user));
    }

    private function prepareAuthPayload(User $user): array
    {
        $accessToken = $this->jwtService->createAccessToken([
            'sub' => $user->id,
            'role' => 'user',
        ]);

        $refreshToken = $this->jwtService->createRefreshToken([
            'sub' => $user->id,
            'role' => 'user',
        ]);

        return [
            'token' => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer',
            'expires_in' => $this->jwtService->getTtl(),
            'refresh_expires_in' => $this->jwtService->getRefreshTtl(),
            'user' => $user->only(['id', 'name', 'email', 'username', 'employee_number']),
        ];
    }
}
