<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\UserLoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AuthController extends Controller
{

    public function login(UserLoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        $user = $this->findAccount($credentials['login'], User::class);

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
}
