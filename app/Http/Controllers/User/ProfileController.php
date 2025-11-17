<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\UpdatePasswordRequest;
use App\Http\Requests\User\UpdateProfileRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->fill($request->validated());
        $user->save();

        return apiResponse('Profile updated successfully.', [
            'user' => $user->only(['id', 'name', 'email', 'username', 'employee_number']),
        ]);
    }

    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (!Hash::check($request->validated('current_password'), $user->password)) {
            return apiResponse('Current password is incorrect.', [], 422);
        }

        $user->password = $request->validated('password');
        $user->save();

        return apiResponse('Password updated successfully.');
    }
}
