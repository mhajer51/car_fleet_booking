<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Booking\AdminBookingFilterRequest;
use App\Models\Booking;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class BookingController extends Controller
{
    public function index(AdminBookingFilterRequest $request): JsonResponse
    {
        $filters = $request->validated();

        $bookingsQuery = Booking::query()
            ->with(['user:id,name,username', 'car:id,name,number'])
            ->latest();

        if (isset($filters['user_id'])) {
            $bookingsQuery->where('user_id', $filters['user_id']);
        }

        if (isset($filters['car_id'])) {
            $bookingsQuery->where('car_id', $filters['car_id']);
        }

        if (isset($filters['status'])) {
            $bookingsQuery->where('status', $filters['status']);
        }

        if (isset($filters['from_date'])) {
            $bookingsQuery->whereDate('start_date', '>=', Carbon::parse($filters['from_date']));
        }

        if (isset($filters['to_date'])) {
            $bookingsQuery->whereDate('start_date', '<=', Carbon::parse($filters['to_date']));
        }

        $bookings = $bookingsQuery->get()->map(function (Booking $booking) {
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
                'start_date' => $booking->start_date,
                'end_date' => $booking->end_date,
                'status' => $booking->status->value,
            ];
        });


        return apiResponse('successfully.',compact('bookings'));

    }
}
