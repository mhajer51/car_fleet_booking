<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ToggleStatusRequest;
use App\Http\Requests\Admin\User\AdminUserStoreRequest;
use App\Http\Requests\Admin\User\AdminUserUpdateRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->integer('per_page', 10);
        $perPage = $perPage > 0 ? min($perPage, 100) : 10;

        $search = trim((string) $request->query('search', ''));
        $status = $request->query('status');

        $query = User::query();

        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('employee_number', 'like', "%{$search}%");
            });
        }

        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'suspended') {
            $query->where('is_active', false);
        }

        $paginator = $query->latest()->paginate($perPage);

        $users = $paginator->getCollection()->map(fn (User $user) => $this->transformUser($user));

        return apiResponse('Users fetched successfully.', [
            'users' => $users,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
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
            'role' => $data['role'],
            'is_active' => $data['is_active'] ?? true,
        ]);

        $user = $this->transformUser($user);

        return apiResponse('User created successfully.',compact('user'));

    }

    public function update(AdminUserUpdateRequest $request, User $user): JsonResponse
    {
        $data = $request->validated();

        $payload = array_filter([
            'name' => $data['name'] ?? null,
            'username' => $data['username'] ?? null,
            'email' => $data['email'] ?? null,
            'employee_number' => $data['number_employ'] ?? null,
            'role' => $data['role'] ?? null,
            'is_active' => $data['is_active'] ?? null,
        ], fn ($value) => ! is_null($value));

        if (array_key_exists('password', $data) && $data['password']) {
            $payload['password'] = $data['password'];
        }

        $user->update($payload);


        $user = $this->transformUser($user->fresh());

        return apiResponse('User updated successfully.',compact('user'));

    }

    public function updateStatus(ToggleStatusRequest $request, User $user): JsonResponse
    {
        $user->update($request->validated());

        $user = $this->transformUser($user->fresh());


        return apiResponse('User status updated successfully.',compact('user'));

    }

    public function destroy(User $user): JsonResponse
    {
        $user->delete();

        return apiResponse('User deleted successfully.');
    }

    private function transformUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'number_employ' => $user->employee_number,
            'role' => $user->role,
            'is_active' => $user->is_active,
        ];
    }
}
