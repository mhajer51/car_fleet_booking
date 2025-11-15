<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Concerns\HandlesAccountAuthentication;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    use HandlesAccountAuthentication;

    public function login(Request $request): JsonResponse
    {
        $credentials = $this->validateCredentials($request);

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
