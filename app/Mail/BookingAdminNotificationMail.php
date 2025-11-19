<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class BookingAdminNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Booking $booking,
        public readonly string $action
    ) {
    }

    public function build(): self
    {
        $statusLabel = match ($this->booking->status->value) {
            'upcoming' => 'Upcoming booking',
            'active' => 'Ongoing booking',
            default => 'Completed booking',
        };

        $statusColor = match ($this->booking->status->value) {
            'upcoming' => '#0ea5e9',
            'active' => '#22c55e',
            default => '#6b7280',
        };

        $actionTitle = $this->action === 'created'
            ? 'New booking created'
            : 'Booking updated';

        return $this
            ->subject($actionTitle . ' | Fleet Admin')
            ->view('emails.booking-admin-notification')
            ->with([
                'actionTitle' => $actionTitle,
                'statusLabel' => $statusLabel,
                'statusColor' => $statusColor,
            ]);
    }
}
