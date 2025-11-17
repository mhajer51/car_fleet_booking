<?php

namespace App\Http\Controllers\User;

use App\Enums\BookingStatus;
use App\Exceptions\BookingConflictException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Booking\AdminBookingAvailabilityRequest;
use App\Http\Requests\Admin\Booking\AdminBookingFilterRequest;
use App\Http\Requests\User\StoreBookingRequest;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Driver;
use App\Models\User;
use App\Services\Bookings\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class BookingController extends Controller
{
    public function __construct(private readonly BookingService $bookingService)
    {
    }

    public function index(AdminBookingFilterRequest $request): JsonResponse
    {
        $filters = $request->validated();

        $perPage = (int) $request->integer('per_page', 10);
        $perPage = $perPage > 0 ? min($perPage, 50) : 10;

        $bookingsQuery = Booking::query()
            ->with(['user:id,name,username', 'car:id,name,number,emirate', 'driver:id,name,license_number'])
            ->latest();

        if (isset($filters['user_id'])) {
            $bookingsQuery->where('user_id', $filters['user_id']);
        }

        if (isset($filters['car_id'])) {
            $bookingsQuery->where('car_id', $filters['car_id']);
        }

        if (isset($filters['driver_id'])) {
            $bookingsQuery->where('driver_id', $filters['driver_id']);
        }

        if (isset($filters['status'])) {
            $bookingsQuery->status(BookingStatus::from($filters['status']));
        }

        if (isset($filters['from_date'])) {
            $bookingsQuery->whereDate('start_date', '>=', Carbon::parse($filters['from_date']));
        }

        if (isset($filters['to_date'])) {
            $bookingsQuery->whereDate('start_date', '<=', Carbon::parse($filters['to_date']));
        }

        $paginator = $bookingsQuery->paginate($perPage);

        $bookings = $paginator->getCollection()->map(fn (Booking $booking) => $this->transformBooking($booking));

        return apiResponse('Bookings fetched successfully.', [
            'bookings' => $bookings,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    public function store(StoreBookingRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = User::findOrFail($data['user_id']);
        $car = Car::findOrFail($data['car_id']);
        $driver = Driver::findOrFail($data['driver_id']);
        $startDate = Carbon::parse($data['start_date']);
        $endDate = isset($data['end_date']) ? Carbon::parse($data['end_date']) : null;
        $note = $data['note'] ?? null;
        $price = (float) $data['price'];

        try {
            $booking = $this->bookingService->create($user, $car, $driver, $startDate, $endDate, null, $note, $price);
        } catch (BookingConflictException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        $booking = $this->transformBooking($booking->load(['user:id,name,username', 'car:id,name,number,emirate', 'driver:id,name,license_number']));

        return apiResponse('Car booked successfully.', compact('booking'));
    }

    public function availableUsers(AdminBookingAvailabilityRequest $request): JsonResponse
    {
        [$startDate, $endDate, $search, $perPage, $bookingId] = $this->extractAvailabilityFilters($request);

        $usersQuery = User::query()->availableForPeriod($startDate, $endDate, $bookingId);

        if ($search !== '') {
            $usersQuery->where(function ($builder) use ($search): void {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('employee_number', 'like', "%{$search}%");
            });
        }

        $paginator = $usersQuery->latest()->paginate($perPage);
        $users = $paginator->getCollection()->map(fn (User $user) => [
            'id' => $user->id,
            'name' => $user->name,
            'employee_number' => $user->employee_number,
            'username' => $user->username,
        ]);

        return apiResponse('Available users fetched successfully.', $this->buildAvailabilityResponse($paginator, 'users', $users));
    }

    public function availableCars(AdminBookingAvailabilityRequest $request): JsonResponse
    {
        [$startDate, $endDate, $search, $perPage, $bookingId] = $this->extractAvailabilityFilters($request);

        $carsQuery = Car::query()->availableForPeriod($startDate, $endDate, $bookingId);

        if ($search !== '') {
            $carsQuery->where(function ($builder) use ($search): void {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('number', 'like', "%{$search}%");
            });
        }

        $paginator = $carsQuery->latest()->paginate($perPage);
        $cars = $paginator->getCollection()->map(fn (Car $car) => [
            'id' => $car->id,
            'name' => $car->name,
            'number' => $car->number,
            'emirate' => $car->emirate,
        ]);

        return apiResponse('Available cars fetched successfully.', $this->buildAvailabilityResponse($paginator, 'cars', $cars));
    }

    public function availableDrivers(AdminBookingAvailabilityRequest $request): JsonResponse
    {
        [$startDate, $endDate, $search, $perPage, $bookingId] = $this->extractAvailabilityFilters($request);

        $driversQuery = Driver::query()->availableForPeriod($startDate, $endDate, $bookingId);

        if ($search !== '') {
            $driversQuery->where(function ($builder) use ($search): void {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('license_number', 'like', "%{$search}%");
            });
        }

        $paginator = $driversQuery->latest()->paginate($perPage);
        $drivers = $paginator->getCollection()->map(fn (Driver $driver) => [
            'id' => $driver->id,
            'name' => $driver->name,
            'license_number' => $driver->license_number,
        ]);

        return apiResponse('Available drivers fetched successfully.', $this->buildAvailabilityResponse($paginator, 'drivers', $drivers));
    }

    public function returnCar(Booking $booking): JsonResponse
    {
        $booking = $this->bookingService->close($booking);


        return apiResponse('Booking closed successfully.',compact('booking'));

    }

    private function transformBooking(Booking $booking): array
    {
        return [
            'id' => $booking->id,
            'user' => $booking->user ? [
                'id' => $booking->user->id,
                'name' => $booking->user->name,
                'username' => $booking->user->username,
                'is_guest' => false,
            ] : [
                'name' => $booking->guest_name,
                'is_guest' => true,
            ],
            'car' => [
                'id' => $booking->car->id,
                'name' => $booking->car->name,
                'number' => $booking->car->number,
                'emirate' => $booking->car->emirate,
            ],
            'driver' => [
                'id' => $booking->driver->id,
                'name' => $booking->driver->name,
                'license_number' => $booking->driver->license_number,
            ],
            'price' => $booking->price,
            'start_date' => $booking->start_date,
            'end_date' => $booking->end_date,
            'guest_name' => $booking->guest_name,
            'note' => $booking->note,
            'status' => $booking->status->value,
        ];
    }

    private function extractAvailabilityFilters(AdminBookingAvailabilityRequest $request): array
    {
        $filters = $request->validated();
        $startDate = Carbon::parse($filters['start_date']);
        $endDate = isset($filters['end_date']) ? Carbon::parse($filters['end_date']) : null;
        $search = trim((string) ($filters['search'] ?? ''));
        $perPage = (int) ($filters['per_page'] ?? 10);
        $perPage = $perPage > 0 ? min($perPage, 50) : 10;
        $bookingId = $filters['booking_id'] ?? null;

        return [$startDate, $endDate, $search, $perPage, $bookingId];
    }

    private function buildAvailabilityResponse($paginator, string $key, $items): array
    {
        return [
            $key => $items,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ];
    }
}
