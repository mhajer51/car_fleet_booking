<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $actionTitle }}</title>
    <style>
        body {
            background: linear-gradient(135deg, #0f172a, #111827);
            color: #e5e7eb;
            font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 24px;
        }

        .mail-wrapper {
            max-width: 760px;
            margin: 0 auto;
        }

        .card {
            background: rgba(17, 24, 39, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 18px;
            box-shadow: 0 28px 60px rgba(0, 0, 0, 0.35);
            overflow: hidden;
            backdrop-filter: blur(12px);
        }

        .hero {
            background: radial-gradient(circle at 12% 20%, rgba(14, 165, 233, 0.25), transparent 32%),
                        radial-gradient(circle at 88% 25%, rgba(34, 197, 94, 0.25), transparent 28%),
                        linear-gradient(135deg, #0ea5e9, #6366f1);
            padding: 28px 32px;
            color: #f8fafc;
        }

        .hero h1 {
            margin: 0 0 8px;
            font-size: 22px;
            letter-spacing: 0.2px;
        }

        .hero p {
            margin: 0;
            opacity: 0.9;
            font-size: 14px;
        }

        .content {
            padding: 28px 32px 32px;
        }

        .pill {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 999px;
            padding: 10px 16px;
            margin-bottom: 16px;
            color: #e2e8f0;
            font-weight: 600;
            letter-spacing: 0.2px;
        }

        .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            display: inline-block;
        }

        .details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
            gap: 16px;
            margin-top: 12px;
        }

        .detail-card {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 12px;
            padding: 14px 16px;
        }

        .label {
            display: block;
            color: #9ca3af;
            font-size: 12px;
            margin-bottom: 6px;
            letter-spacing: 0.4px;
        }

        .value {
            color: #f8fafc;
            font-size: 15px;
            margin: 0;
            font-weight: 600;
        }

        .note {
            margin-top: 18px;
            padding: 14px 16px;
            border-radius: 12px;
            background: rgba(14, 165, 233, 0.08);
            border: 1px solid rgba(14, 165, 233, 0.15);
            color: #e0f2fe;
            line-height: 1.6;
        }

        .footer {
            margin-top: 18px;
            padding: 0 4px 12px;
            color: #9ca3af;
            font-size: 12px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="mail-wrapper">
        <div class="card">
            <div class="hero">
                <h1>{{ $actionTitle }}</h1>
                <p>The booking was processed successfully. Below is a concise summary for your review.</p>
            </div>

            <div class="content">
                <div class="pill">
                    <span class="status-dot" style="background: {{ $statusColor }};"></span>
                    <span>{{ $statusLabel }}</span>
                    <span style="opacity: 0.7; font-weight: 500;">| {{ optional($booking->user)->name ?? $booking->guest_name }}</span>
                </div>

                <div class="details">
                    <div class="detail-card">
                        <span class="label">Customer</span>
                        <p class="value">{{ optional($booking->user)->name ?? $booking->guest_name }} ({{ optional($booking->user)->username ?? 'Guest' }})</p>
                    </div>
                    <div class="detail-card">
                        <span class="label">Vehicle</span>
                        <p class="value">{{ $booking->car->name }} — {{ $booking->car->number }} ({{ $booking->car->emirate }})</p>
                    </div>
                    <div class="detail-card">
                        <span class="label">Driver</span>
                        <p class="value">{{ $booking->driver->name }} — License {{ $booking->driver->license_number }}</p>
                    </div>
                    <div class="detail-card">
                        <span class="label">Start date</span>
                        <p class="value">{{ $booking->start_date->format('d M Y - h:i A') }}</p>
                    </div>
                    <div class="detail-card">
                        <span class="label">Return date</span>
                        <p class="value">{{ $booking->end_date?->format('d M Y - h:i A') ?? 'Open until further notice' }}</p>
                    </div>
                    <div class="detail-card">
                        <span class="label">Price</span>
                        <p class="value">AED {{ number_format((float) $booking->price, 2) }}</p>
                    </div>
                </div>

                @if($booking->note)
                    <div class="note">
                        <strong>Additional notes:</strong>
                        <div>{{ $booking->note }}</div>
                    </div>
                @endif
            </div>

            <div class="footer">
                Sent by Fleet Management — Admin alert
            </div>
        </div>
    </div>
</body>
</html>
