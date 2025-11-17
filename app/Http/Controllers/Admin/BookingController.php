<?php

namespace App\Http\Controllers\Admin;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Exceptions\BookingConflictException;
use App\Http\Requests\Admin\Booking\AdminBookingFilterRequest;
use App\Http\Requests\Admin\Booking\AdminStoreBookingRequest;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Driver;
use App\Models\User;
use App\Services\Bookings\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

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
            ->with(['user:id,name,username', 'car:id,name,number', 'driver:id,name,license_number'])
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

    public function store(AdminStoreBookingRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = isset($data['user_id'])
            ? User::findOrFail($data['user_id'])
            : $this->createGuestUser($data['guest_name']);

        $car = Car::findOrFail($data['car_id']);
        $driver = Driver::findOrFail($data['driver_id']);
        $startDate = Carbon::parse($data['start_date']);
        $endDate = isset($data['end_date']) ? Carbon::parse($data['end_date']) : null;

        try {
            $booking = $this->bookingService->create($user, $car, $driver, $startDate, $endDate);
        } catch (BookingConflictException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        $booking = $this->transformBooking($booking->load(['user:id,name,username', 'car:id,name,number', 'driver:id,name,license_number']));

        return apiResponse('Booking created successfully.', compact('booking'));
    }

    private function createGuestUser(string $name): User
    {
        $identifier = 'guest_' . Str::lower(Str::random(10));

        return User::create([
            'name' => $name,
            'username' => $identifier,
            'email' => sprintf('%s@guest.local', $identifier),
            'employee_number' => strtoupper(Str::random(10)),
            'password' => Str::random(12),
            'is_active' => true,
        ]);
    }

    private function transformBooking(Booking $booking): array
    {
        return [
            'id' => $booking->id,
            'user' => [
                'id' => $booking->user->id,
                'name' => $booking->user->name,
                'username' => $booking->user->username,
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
            'start_date' => $booking->start_date,
            'end_date' => $booking->end_date,
            'status' => $booking->status->value,
        ];
    }
}
