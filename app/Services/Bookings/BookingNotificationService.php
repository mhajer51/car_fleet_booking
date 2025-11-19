<?php

namespace App\Services\Bookings;

use App\Mail\BookingAdminNotificationMail;
use App\Models\Admin;
use App\Models\Booking;
use Illuminate\Support\Facades\Mail;

class BookingNotificationService
{
    public function notifyAdmins(Booking $booking, string $action): void
    {
        $adminEmails = Admin::query()
            ->where('is_active', true)
            ->pluck('email')
            ->filter()
            ->values();

        if ($adminEmails->isEmpty()) {
            return;
        }

        $booking->loadMissing(['user:id,name,username,email', 'car:id,name,number,emirate', 'driver:id,name,license_number']);

        Mail::to($adminEmails)->send(new BookingAdminNotificationMail($booking, $action));
    }
}
