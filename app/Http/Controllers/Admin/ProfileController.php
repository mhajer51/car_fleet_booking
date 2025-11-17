<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdatePasswordRequest;
use App\Http\Requests\Admin\UpdateProfileRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $admin = $request->user();
        $admin->fill($request->validated());
        $admin->save();

        return apiResponse('Profile updated successfully.', [
            'admin' => $admin->only(['id', 'name', 'email', 'username']),
        ]);
    }

    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $admin = $request->user();

        if (!Hash::check($request->validated('current_password'), $admin->password)) {
            return apiResponse('Current password is incorrect.', [], 422);
        }

        $admin->password = $request->validated('password');
        $admin->save();

        return apiResponse('Password updated successfully.');
    }
}
