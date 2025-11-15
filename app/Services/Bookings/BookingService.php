<?php

namespace App\Services\Bookings;

use App\Enums\BookingStatus;
use App\Exceptions\BookingConflictException;
use App\Models\Booking;
use App\Models\Car;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class BookingService
{
    public function create(User $user, Car $car, Carbon $startDate, ?Carbon $endDate = null): Booking
    {
        if (!$user->is_active) {
            throw new InvalidArgumentException('Inactive users cannot create bookings.');
        }

        if (!$car->is_active) {
            throw new InvalidArgumentException('Inactive cars cannot be booked.');
        }

        if ($endDate !== null && $endDate->lt($startDate)) {
            throw new InvalidArgumentException('End date must be greater than or equal to the start date.');
        }

        $conflict = $car->bookings()
            ->active()
            ->overlapping($startDate, $endDate)
            ->exists();

        if ($conflict) {
            throw new BookingConflictException('Car is not available for the requested period.');
        }

        return DB::transaction(function () use ($user, $car, $startDate, $endDate) {
            return Booking::create([
                'user_id' => $user->id,
                'car_id' => $car->id,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => BookingStatus::ACTIVE,
            ]);
        });
    }

    public function close(Booking $booking): Booking
    {
        if ($booking->status !== BookingStatus::ACTIVE) {
            return $booking;
        }

        $booking->update([
            'end_date' => $booking->end_date ?? Carbon::now(),
            'status' => BookingStatus::CLOSED,
        ]);

        return $booking->refresh();
    }
}
