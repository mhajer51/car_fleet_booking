<?php

namespace App\Http\Controllers\Admin;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Car;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $now = now();

        $activeBookingsToday = Booking::query()
            ->where('status', BookingStatus::ACTIVE->value)
            ->where('start_date', '<=', $now)
            ->where(function ($query) use ($now) {
                $query->whereNull('end_date')
                    ->orWhere('end_date', '>=', $now);
            })
            ->count();

        $latestBookings = Booking::query()
            ->with(['user:id,name,username', 'car:id,name,number'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(function (Booking $booking) {
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


        return apiResponse('Admin logged in successfully.',[
            'users_total' => User::count(),
            'cars_total' => Car::count(),
            'active_bookings_today' => $activeBookingsToday,
            'latest_bookings' => $latestBookings,
        ]);

    }
}
