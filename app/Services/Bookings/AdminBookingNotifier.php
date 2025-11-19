<?php

namespace App\Services\Bookings;

use App\Models\Admin;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Mail;
use Throwable;

class AdminBookingNotifier
{
    public function notify(Mailable $notification): void
    {
        $recipients = Admin::query()
            ->where('is_active', true)
            ->whereNotNull('email')
            ->pluck('email')
            ->filter()
            ->unique()
            ->values()
            ->all();

        $fallbackRecipient = config('mail.from.address');

        if (empty($recipients) && $fallbackRecipient) {
            $recipients = [$fallbackRecipient];
        }

        if (empty($recipients)) {
            return;
        }

        try {
            Mail::to($recipients)->send($notification);
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
