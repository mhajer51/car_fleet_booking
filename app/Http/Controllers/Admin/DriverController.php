<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Driver\AdminDriverStoreRequest;
use App\Http\Requests\Admin\Driver\AdminDriverUpdateRequest;
use App\Http\Requests\Admin\ToggleStatusRequest;
use App\Models\Driver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;

class DriverController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->integer('per_page', 10);
        $perPage = $perPage > 0 ? min($perPage, 100) : 10;

        $search = trim((string) $request->query('search', ''));
        $isActive = $request->query('is_active');

        $query = Driver::query()->withCount('activeBookings');

        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('license_number', 'like', "%{$search}%")
                    ->orWhere('phone_number', 'like', "%{$search}%");
            });
        }

        if (! is_null($isActive)) {
            $boolean = filter_var($isActive, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if (! is_null($boolean)) {
                $query->where('is_active', $boolean);
            }
        }

        $paginator = $query->latest()->paginate($perPage);

        $drivers = $paginator->getCollection()->map(
            fn (Driver $driver) => $this->transformDriver($driver, $driver->active_bookings_count)
        );

        return apiResponse('Drivers fetched successfully.', [
            'drivers' => $drivers,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    public function store(AdminDriverStoreRequest $request): JsonResponse
    {
        $data = $request->validated();

        try {
            $driver = Driver::create([
                'name' => $data['name'],
                'license_number' => $data['license_number'],
                'phone_number' => $data['phone_number'],
                'is_active' => $data['is_active'] ?? true,
            ]);
        } catch (QueryException $exception) {
            if ($this->isUniqueViolation($exception)) {
                return apiResponse('Validation failed', [
                    'license_number' => ['This license number is already assigned.'],
                    'phone_number' => ['This phone number is already in use.'],
                ], 422);
            }

            throw $exception;
        }

        $driver = $this->transformDriver($driver, 0);

        return apiResponse('Driver created successfully.', compact('driver'));
    }

    public function update(AdminDriverUpdateRequest $request, Driver $driver): JsonResponse
    {
        $data = $request->validated();

        try {
            $driver->update($data);
        } catch (QueryException $exception) {
            if ($this->isUniqueViolation($exception)) {
                return apiResponse('Validation failed', [
                    'license_number' => ['This license number is already assigned.'],
                    'phone_number' => ['This phone number is already in use.'],
                ], 422);
            }

            throw $exception;
        }
        $driver->refresh()->loadCount('activeBookings');

        $driver = $this->transformDriver($driver, $driver->active_bookings_count);

        return apiResponse('Driver updated successfully.', compact('driver'));
    }

    public function updateStatus(ToggleStatusRequest $request, Driver $driver): JsonResponse
    {
        $driver->update($request->validated());
        $driver->refresh()->loadCount('activeBookings');

        $driver = $this->transformDriver($driver, $driver->active_bookings_count);

        return apiResponse('Driver status updated successfully.', compact('driver'));
    }

    private function transformDriver(Driver $driver, ?int $activeBookingCount = null): array
    {
        $activeCount = $activeBookingCount ?? $driver->loadCount('activeBookings')->active_bookings_count;
        $isAssigned = $activeCount > 0;

        return [
            'id' => $driver->id,
            'name' => $driver->name,
            'license_number' => $driver->license_number,
            'phone_number' => $driver->phone_number,
            'status' => $isAssigned ? 'assigned' : 'available',
            'is_active' => $driver->is_active,
        ];
    }

    private function isUniqueViolation(QueryException $exception): bool
    {
        return in_array($exception->getCode(), ['23000', '23505'], true)
            || in_array($exception->errorInfo[0] ?? null, ['23000', '23505'], true);
    }
}
