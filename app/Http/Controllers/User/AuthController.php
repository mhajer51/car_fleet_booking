<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
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

        $token = $this->jwtService->createToken([
            'sub' => $user->id,
            'role' => 'user',
        ]);

        return apiResponse('User logged in successfully.', [
            'token' => $token,
            'token_type' => 'Bearer',
            'expires_in' => $this->jwtService->getTtl(),
            'user' => $user->only(['id', 'name', 'email', 'username', 'employee_number']),
        ]);
    }
}
