<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ToggleStatusRequest;
use App\Http\Requests\Admin\User\AdminUserStoreRequest;
use App\Http\Requests\Admin\User\AdminUserUpdateRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::query()
            ->latest()
            ->get()
            ->map(fn (User $user) => $this->transformUser($user));

        return response()->json(['users' => $users]);
    }

    public function store(AdminUserStoreRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::create([
            'name' => $data['name'],
            'username' => $data['username'],
            'email' => $data['email'],
            'employee_number' => $data['number_employ'],
            'password' => $data['password'],
            'is_active' => $data['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'User created successfully.',
            'user' => $this->transformUser($user),
        ], 201);
    }

    public function update(AdminUserUpdateRequest $request, User $user): JsonResponse
    {
        $data = $request->validated();

        $payload = array_filter([
            'name' => $data['name'] ?? null,
            'username' => $data['username'] ?? null,
            'email' => $data['email'] ?? null,
            'employee_number' => $data['number_employ'] ?? null,
            'is_active' => $data['is_active'] ?? null,
        ], fn ($value) => ! is_null($value));

        if (array_key_exists('password', $data) && $data['password']) {
            $payload['password'] = $data['password'];
        }

        $user->update($payload);

        return response()->json([
            'message' => 'User updated successfully.',
            'user' => $this->transformUser($user->fresh()),
        ]);
    }

    public function updateStatus(ToggleStatusRequest $request, User $user): JsonResponse
    {
        $user->update($request->validated());

        return response()->json([
            'message' => 'User status updated successfully.',
            'user' => $this->transformUser($user->fresh()),
        ]);
    }

    private function transformUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'number_employ' => $user->employee_number,
            'is_active' => $user->is_active,
        ];
    }
}
