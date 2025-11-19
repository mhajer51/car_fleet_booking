<?php

namespace App\Services\Bookings;

use App\Enums\BookingStatus;
use App\Exceptions\BookingConflictException;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Driver;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class BookingService
{
    public function create(
        ?User $user,
        Car $car,
        Driver $driver,
        Carbon $startDate,
        ?Carbon $endDate = null,
        ?string $guestName = null,
        ?string $note = null,
        ?float $price = null,
        bool $isApproved = true
    ): Booking
    {
        if ($user && !$user->is_active) {
            throw new InvalidArgumentException('Inactive users cannot create bookings.');
        }

//        if (!$car->is_active) {
//            throw new InvalidArgumentException('Inactive cars cannot be booked.');
//        }
//
//        if (!$driver->is_active) {
//            throw new InvalidArgumentException('Inactive drivers cannot be assigned to bookings.');
//        }

        if ($endDate !== null && $endDate->lt($startDate)) {
            throw new InvalidArgumentException('End date must be greater than or equal to the start date.');
        }

        $carConflict = $car->bookings()
            ->overlapping($startDate, $endDate)
            ->exists();

        if ($carConflict) {
            throw new BookingConflictException('Car is not available for the requested period.');
        }

        $driverConflict = $driver->bookings()
            ->overlapping($startDate, $endDate)
            ->exists();

        if ($driverConflict) {
            throw new BookingConflictException('Driver is already assigned to another booking during this time.');
        }

        return DB::transaction(function () use ($user, $car, $driver, $startDate, $endDate, $guestName, $note, $price, $isApproved) {
            return Booking::create([
                'user_id' => $user?->id,
                'guest_name' => $guestName,
                'car_id' => $car->id,
                'driver_id' => $driver->id,
                'price' => $price,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'note' => $note,
                'is_approved' => $isApproved,
            ]);
        });
    }

    public function update(Booking $booking, ?User $user, Car $car, Driver $driver, Carbon $startDate, ?Carbon $endDate = null, ?string $guestName = null, ?string $note = null, ?float $price = null): Booking
    {
        if ($user && !$user->is_active) {
            throw new InvalidArgumentException('Inactive users cannot create bookings.');
        }

//        if (!$car->is_active) {
//            throw new InvalidArgumentException('Inactive cars cannot be booked.');
//        }
//
//        if (!$driver->is_active) {
//            throw new InvalidArgumentException('Inactive drivers cannot be assigned to bookings.');
//        }

        if ($endDate !== null && $endDate->lt($startDate)) {
            throw new InvalidArgumentException('End date must be greater than or equal to the start date.');
        }

        $carConflict = $car->bookings()
            ->where('id', '!=', $booking->id)
            ->overlapping($startDate, $endDate)
            ->exists();

        if ($carConflict) {
            throw new BookingConflictException('Car is not available for the requested period.');
        }

        $driverConflict = $driver->bookings()
            ->where('id', '!=', $booking->id)
            ->overlapping($startDate, $endDate)
            ->exists();

        if ($driverConflict) {
            throw new BookingConflictException('Driver is already assigned to another booking during this time.');
        }

        DB::transaction(function () use ($booking, $user, $car, $driver, $startDate, $endDate, $guestName, $note, $price) {
            $booking->update([
                'user_id' => $user?->id,
                'guest_name' => $guestName,
                'car_id' => $car->id,
                'driver_id' => $driver->id,
                'price' => $price,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'note' => $note,
            ]);
        });

        return $booking->refresh();
    }

    public function close(Booking $booking): Booking
    {
        if (!$booking->is_approved || $booking->status !== BookingStatus::ACTIVE) {
            return $booking;
        }

        $booking->update([
            'end_date' => $booking->end_date ?? Carbon::now(),
        ]);

        return $booking->refresh();
    }
}
