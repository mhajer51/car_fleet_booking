<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ __('New booking request received') }}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #0f172a; }
        .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 0 auto; max-width: 640px; background: #ffffff; }
        .muted { color: #475569; font-size: 14px; }
        .details { width: 100%; border-collapse: collapse; margin-top: 16px; }
        .details th { text-align: left; padding: 8px 12px; background: #f8fafc; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
        .details td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
        .note { margin-top: 16px; padding: 12px; border-left: 3px solid #0284c7; background: #f0f9ff; }
    </style>
</head>
<body>
<div class="card">
    <h1 style="margin-top: 0;">{{ __('A new booking requires your review') }}</h1>
    <p class="muted">{{ __('The following reservation was created from the user portal and is awaiting approval.') }}</p>

    <table class="details">
        <tr>
            <th>{{ __('Requested by') }}</th>
            <td>{{ $booking->user->name ?? $booking->guest_name ?? __('Guest user') }}</td>
        </tr>
        <tr>
            <th>{{ __('Vehicle') }}</th>
            <td>{{ $booking->car->name ?? __('Unassigned car') }} ({{ $booking->car->number ?? __('n/a') }})</td>
        </tr>
        <tr>
            <th>{{ __('Driver') }}</th>
            <td>{{ $booking->driver->name ?? __('Unassigned driver') }}</td>
        </tr>
        <tr>
            <th>{{ __('Start date') }}</th>
            <td>{{ optional($booking->start_date)->timezone(config('app.timezone'))->format('d M Y H:i') }}</td>
        </tr>
        <tr>
            <th>{{ __('End date') }}</th>
            <td>
                @if ($booking->end_date)
                    {{ $booking->end_date->timezone(config('app.timezone'))->format('d M Y H:i') }}
                @else
                    {{ __('Open booking') }}
                @endif
            </td>
        </tr>
        <tr>
            <th>{{ __('Quoted price') }}</th>
            <td>{{ $booking->price ? number_format((float) $booking->price, 2) : __('Not provided') }}</td>
        </tr>
    </table>

    @if ($booking->note)
        <div class="note">
            <strong>{{ __('Notes from the requester') }}:</strong>
            <p style="margin: 8px 0 0; white-space: pre-line;">{{ $booking->note }}</p>
        </div>
    @endif

    <p class="muted" style="margin-top: 24px;">
        {{ __('Thank you, :app support bot', ['app' => config('app.name')]) }}
    </p>
</div>
</body>
</html>
