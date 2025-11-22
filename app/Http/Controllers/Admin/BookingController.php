<?php

namespace App\Http\Controllers\Admin;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Exceptions\BookingConflictException;
use App\Http\Requests\Admin\Booking\AdminBookingAvailabilityRequest;
use App\Http\Requests\Admin\Booking\AdminBookingFilterRequest;
use App\Http\Requests\Admin\Booking\AdminStoreBookingRequest;
use App\Http\Requests\Admin\Booking\AdminToggleBookingApprovalRequest;
use App\Http\Requests\Admin\Booking\AdminUpdateBookingRequest;
use App\Mail\BookingRequestSubmitted;
use App\Mail\BookingRequestUpdated;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Driver;
use App\Models\User;
use App\Services\Bookings\BookingService;
use App\Services\Bookings\AdminBookingNotifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class BookingController extends Controller
{
    public function __construct(
        private readonly BookingService $bookingService,
        private readonly AdminBookingNotifier $adminBookingNotifier,
    ) {
    }

    public function index(AdminBookingFilterRequest $request): JsonResponse
    {
        $filters = $request->validated();

        $perPage = (int) $request->integer('per_page', 10);
        $perPage = $perPage > 0 ? min($perPage, 50) : 10;

        $bookingsQuery = Booking::query()
            ->with([
                'user:id,name,username',
                'car:id,name,number',
                'driver:id,name,license_number',
            ])
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

        if (isset($filters['is_approved'])) {
            $bookingsQuery->where('is_approved', (bool) $filters['is_approved']);
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

    public function store(AdminStoreBookingRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = isset($data['user_id'])
            ? User::findOrFail($data['user_id'])
            : null;

        $guestName = $user ? null : $data['guest_name'];
        $note = $data['note'] ?? ($guestName ? sprintf('Guest booking by %s', $guestName) : null);

        $car = Car::findOrFail($data['car_id']);
        $driver = Driver::findOrFail($data['driver_id']);
        $startDate = Carbon::parse($data['start_date']);
        $endDate = isset($data['end_date']) ? Carbon::parse($data['end_date']) : null;
        $price = (float) $data['price'];

        try {
            $booking = $this->bookingService->create($user, $car, $driver, $startDate, $endDate, $guestName, $note, $price);
        } catch (BookingConflictException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        $booking->load(['user:id,name,email,username', 'car:id,name,number', 'driver:id,name,license_number']);
        $this->adminBookingNotifier->notify(new BookingRequestSubmitted($booking));

        $booking = $this->transformBooking($booking);

        return apiResponse('Booking created successfully.', compact('booking'));
    }

    public function update(AdminUpdateBookingRequest $request, Booking $booking): JsonResponse
    {
        $data = $request->validated();

        $user = isset($data['user_id'])
            ? User::findOrFail($data['user_id'])
            : null;

        $guestName = $user ? null : $data['guest_name'];
        $note = $data['note'] ?? ($guestName ? sprintf('Guest booking by %s', $guestName) : null);

        $car = Car::findOrFail($data['car_id']);
        $driver = Driver::findOrFail($data['driver_id']);
        $startDate = Carbon::parse($data['start_date']);
        $endDate = isset($data['end_date']) ? Carbon::parse($data['end_date']) : null;
        $price = (float) $data['price'];

        try {
            $booking = $this->bookingService->update($booking, $user, $car, $driver, $startDate, $endDate, $guestName, $note, $price);
        } catch (BookingConflictException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        $booking->load(['user:id,name,email,username', 'car:id,name,number', 'driver:id,name,license_number']);
        $this->adminBookingNotifier->notify(new BookingRequestUpdated($booking));

        $booking = $this->transformBooking($booking);

        return apiResponse('Booking updated successfully.', compact('booking'));
    }

    public function updateApproval(AdminToggleBookingApprovalRequest $request, Booking $booking): JsonResponse
    {
        $data = $request->validated();

        if ($data['is_approved']) {
            $carConflict = Booking::query()
                ->where('car_id', $booking->car_id)
                ->where('id', '!=', $booking->id)
                ->overlapping($booking->start_date, $booking->end_date)
                ->exists();

            if ($carConflict) {
                return response()->json([
                    'message' => 'Car is already booked during this time.',
                ], 422);
            }

            $driverConflict = Booking::query()
                ->where('driver_id', $booking->driver_id)
                ->where('id', '!=', $booking->id)
                ->overlapping($booking->start_date, $booking->end_date)
                ->exists();

            if ($driverConflict) {
                return response()->json([
                    'message' => 'Driver is already assigned to another booking during this time.',
                ], 422);
            }
        }

        $booking->update($data);

        $booking = $this->transformBooking($booking->load(['user:id,name,username', 'car:id,name,number', 'driver:id,name,license_number']));

        return apiResponse('Booking approval updated successfully.', compact('booking'));
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

        $users = $usersQuery->latest()->get()->map(fn (User $user) => [
            'id' => $user->id,
            'name' => $user->name,
            'employee_number' => $user->employee_number,
            'username' => $user->username,
        ]);

        return apiResponse('Available users fetched successfully.', ['users' => $users, 'total' => $users->count()]);
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

        $cars = $carsQuery->latest()->get()->map(fn (Car $car) => [
            'id' => $car->id,
            'name' => $car->name,
            'number' => $car->number,
        ]);
        return apiResponse('Available cars fetched successfully.', ['cars' => $cars, 'total' => $cars->count()]);
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

        $drivers = $driversQuery->latest()->get()->map(fn (Driver $driver) => [
            'id' => $driver->id,
            'name' => $driver->name,
            'license_number' => $driver->license_number,
        ]);

        return apiResponse('Available drivers fetched successfully.', ['drivers' => $drivers, 'total' => $drivers->count()]);
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
            ],
            'driver' => [
                'id' => $booking->driver->id,
                'name' => $booking->driver->name,
                'license_number' => $booking->driver->license_number,
            ],
            'price' => $booking->price,
            'start_date' => $booking->start_date,
            'end_date' => $booking->end_date,
            'open_booking' => $booking->end_date === null,
            'guest_name' => $booking->guest_name,
            'note' => $booking->note,
            'status' => $booking->status->value,
            'is_approved' => $booking->is_approved,
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
