<?php

namespace App\Enums;

use Illuminate\Support\Carbon;

enum BookingStatus: string
{
    case UPCOMING = 'upcoming';
    case ACTIVE = 'active';
    case COMPLETED = 'completed';

    public static function values(): array
    {
        return array_map(static fn (self $status) => $status->value, self::cases());
    }

    public static function fromDates(Carbon $startDate, ?Carbon $endDate, ?Carbon $reference = null): self
    {
        $reference ??= Carbon::now();

        if ($startDate->greaterThan($reference)) {
            return self::UPCOMING;
        }

        if ($endDate !== null && $endDate->lessThanOrEqualTo($reference)) {
            return self::COMPLETED;
        }

        return self::ACTIVE;
    }
}
