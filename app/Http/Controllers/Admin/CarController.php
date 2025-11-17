<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Car\AdminCarStoreRequest;
use App\Http\Requests\Admin\Car\AdminCarUpdateRequest;
use App\Http\Requests\Admin\ToggleStatusRequest;
use App\Models\Car;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
                    ->orWhere('number', 'like', "%{$search}%");
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

    public function store(AdminCarStoreRequest $request): JsonResponse
    {
        $data = $request->validated();

        $car = Car::create([
            'name' => $data['name'],
            'model' => $data['model'],
            'color' => $data['color'],
            'number' => $data['number'],
            'is_active' => $data['is_active'] ?? true,
        ]);


        $car = $this->transformCar($car, 0);
        return apiResponse('Car created successfully.',compact('car'));

    }

    public function update(AdminCarUpdateRequest $request, Car $car): JsonResponse
    {
        $data = $request->validated();

        $car->update($data);

        $car->refresh()->loadCount('activeBookings');

        $car = $this->transformCar($car, $car->active_bookings_count);


        return apiResponse('Car updated successfully.',compact('car'));

    }

    public function updateStatus(ToggleStatusRequest $request, Car $car): JsonResponse
    {
        $car->update($request->validated());

        $car->refresh()->loadCount('activeBookings');


        $car = $this->transformCar($car, $car->active_bookings_count);

        return apiResponse('Car status updated successfully.',compact('car'));

    }

    public function destroy(Car $car): JsonResponse
    {
        if ($car->activeBookings()->exists()) {
            return apiResponse('Cannot delete a car with active bookings.', [], 422);
        }

        $car->delete();

        return apiResponse('Car deleted successfully.');
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
            'status' => $isBooked ? 'booked' : 'available',
            'is_active' => $car->is_active,
        ];
    }
}
