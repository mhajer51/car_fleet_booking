<?php

namespace App\Http\Controllers\User;

use App\Enums\BookingStatus;
use App\Exceptions\BookingConflictException;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreBookingRequest;
use App\Models\Booking;
use App\Models\Car;
use App\Models\User;
use App\Services\Bookings\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class BookingController extends Controller
{
    public function __construct(private readonly BookingService $bookingService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'in:' . implode(',', BookingStatus::values())],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'car_id' => ['nullable', 'integer', 'exists:cars,id'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $query = Booking::query()->with(['user:id,name', 'car:id,name']);

        if (!empty($validated['status'])) {
            $query->status(BookingStatus::from($validated['status']));
        }

        if (!empty($validated['user_id'])) {
            $query->where('user_id', $validated['user_id']);
        }

        if (!empty($validated['car_id'])) {
            $query->where('car_id', $validated['car_id']);
        }

        if (!empty($validated['from']) || !empty($validated['to'])) {
            $from = !empty($validated['from']) ? Carbon::parse($validated['from']) : Carbon::create(1970, 1, 1);
            $to = !empty($validated['to']) ? Carbon::parse($validated['to']) : Carbon::create(9999, 12, 31);

            $query->where('start_date', '<=', $to)
                ->where(function ($query) use ($from) {
                    $query->whereNull('end_date')->orWhere('end_date', '>=', $from);
                });
        }

        $bookings = $query
            ->orderByDesc('start_date')
            ->get();


        return apiResponse('successfully.',compact('bookings'));

    }

    public function store(StoreBookingRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = User::findOrFail($data['user_id']);
        $car = Car::findOrFail($data['car_id']);
        $startDate = Carbon::parse($data['start_date']);
        $endDate = isset($data['end_date']) ? Carbon::parse($data['end_date']) : null;

        try {
            $booking = $this->bookingService->create($user, $car, $startDate, $endDate);
        } catch (BookingConflictException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }


        $booking = $booking->load(['user:id,name', 'car:id,name']);

        return apiResponse('Car booked successfully.',compact('booking'));

    }

    public function returnCar(Booking $booking): JsonResponse
    {
        $booking = $this->bookingService->close($booking);


        return apiResponse('Booking closed successfully.',compact('booking'));

    }
}
