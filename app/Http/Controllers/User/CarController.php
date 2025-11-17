<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\Car\UserCarStoreRequest;
use App\Models\Car;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class CarController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->integer('per_page', 10);
        $perPage = $perPage > 0 ? min($perPage, 100) : 10;

        $search = trim((string) $request->query('search', ''));
        $status = $request->query('status');
        $isActive = $request->query('is_active');

        $query = Car::query()->withCount('activeBookings');

        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%")
                    ->orWhere('color', 'like', "%{$search}%")
                    ->orWhere('number', 'like', "%{$search}%")
                    ->orWhere('emirate', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        if ($status === 'booked') {
            $query->whereHas('activeBookings');
        } elseif ($status === 'available') {
            $query->whereDoesntHave('activeBookings');
        }

        if (! is_null($isActive)) {
            $boolean = filter_var($isActive, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if (! is_null($boolean)) {
                $query->where('is_active', $boolean);
            }
        }

        $paginator = $query->latest()->paginate($perPage);

        $cars = $paginator->getCollection()->map(
            fn (Car $car) => $this->transformCar($car, $car->active_bookings_count)
        );

        return apiResponse('Cars fetched successfully.', [
            'cars' => $cars,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    public function store(UserCarStoreRequest $request): JsonResponse
    {
        $data = $request->validated();

        try {
            $car = Car::create([
                'name' => $data['name'],
                'model' => $data['model'],
                'color' => $data['color'],
                'number' => $data['number'],
                'emirate' => $data['emirate'],
                'notes' => $data['notes'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);
        } catch (QueryException $exception) {
            if ($this->isUniqueViolation($exception)) {
                return apiResponse('Validation failed', [
                    'number' => ['This plate number is already registered.'],
                ], 422);
            }

            throw $exception;
        }

        $car = $this->transformCar($car, 0);

        return apiResponse('Car created successfully.', compact('car'));
    }

    public function available(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $startDate = Carbon::parse($validated['start_date']);
        $endDate = isset($validated['end_date']) ? Carbon::parse($validated['end_date']) : null;

        $cars = Car::query()
            ->active()
            ->whereDoesntHave('bookings', function ($query) use ($startDate, $endDate) {
                $query->overlapping($startDate, $endDate);
            })
            ->orderBy('name')
            ->get(['id', 'name', 'model', 'color', 'number']);

        return apiResponse('successfully.', compact('cars'));
    }

    private function transformCar(Car $car, ?int $activeBookingCount = null): array
    {
        $activeCount = $activeBookingCount ?? $car->loadCount('activeBookings')->active_bookings_count;
        $isBooked = $activeCount > 0;

        return [
            'id' => $car->id,
            'name' => $car->name,
            'model' => $car->model,
            'color' => $car->color,
            'number' => $car->number,
            'emirate' => $car->emirate,
            'notes' => $car->notes,
            'status' => $isBooked ? 'booked' : 'available',
            'is_active' => $car->is_active,
        ];
    }

    private function isUniqueViolation(QueryException $exception): bool
    {
        return in_array($exception->getCode(), ['23000', '23505'], true)
            || in_array($exception->errorInfo[0] ?? null, ['23000', '23505'], true);
    }
}
