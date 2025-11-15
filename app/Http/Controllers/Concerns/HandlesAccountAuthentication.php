<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

trait HandlesAccountAuthentication
{
    protected function validateCredentials(Request $request): array
    {
        return $request->validate([
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);
    }

    protected function findAccount(string $login, string $modelClass): ?Model
    {
        return $modelClass::query()
            ->where('username', $login)
            ->orWhere('email', $login)
            ->first();
    }

    protected function ensureAccountIsValid(?Model $account, string $login, string $password): void
    {
        if (! $account || ! Hash::check($password, $account->password)) {
            throw ValidationException::withMessages([
                'login' => ['The provided credentials are incorrect.'],
            ]);
        }
    }
}
