<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Car\AdminCarStoreRequest;
use App\Http\Requests\Admin\Car\AdminCarUpdateRequest;
use App\Http\Requests\Admin\ToggleStatusRequest;
use App\Models\Car;
use Illuminate\Http\JsonResponse;

class CarController extends Controller
{
    public function index(): JsonResponse
    {
        $cars = Car::query()
            ->withCount('activeBookings')
            ->latest()
            ->get()
            ->map(fn (Car $car) => $this->transformCar($car, $car->active_bookings_count));


        return apiResponse('successfully.',compact('cars'));

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
