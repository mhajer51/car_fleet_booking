<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BookingRequestSubmitted extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Booking $booking)
    {
    }

    public function envelope(): Envelope
    {
        $requestor = $this->booking->user?->name
            ?? $this->booking->guest_name
            ?? 'Fleet user';

        return new Envelope(
            subject: __('New booking request from :name', ['name' => $requestor]),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.booking-request-submitted',
            with: [
                'booking' => $this->booking,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
