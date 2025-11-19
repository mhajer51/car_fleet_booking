<?php

namespace App\Http\Controllers\Admin;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Driver;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $now = now();
        $today = $now->clone()->startOfDay();

        $totalCars = Car::query()->count();
        $availableCars = Car::query()->available()->count();
        $inactiveCars = Car::query()->where('is_active', false)->count();
        $statusCounts = $this->bookingStatusCounts();
        $activeBookings = $statusCounts[BookingStatus::ACTIVE->value] ?? 0;
        $bookingsToday = Booking::query()->where('is_approved', true)->whereDate('start_date', $today)->count();
        $newUsersToday = User::query()->whereDate('created_at', $today)->count();

        $metrics = [
            [
                'label' => 'Fleet utilization',
                'value' => sprintf('%d%%', $totalCars ? round(($activeBookings / max($totalCars, 1)) * 100) : 0),
                'detail' => 'Share of vehicles currently dispatched',
                'trend' => sprintf('%d trips live now', $activeBookings),
                'accent' => 'emerald',
            ],
            [
                'label' => "Today's bookings",
                'value' => (string) $bookingsToday,
                'detail' => 'Requests logged since midnight',
                'trend' => sprintf('+%d new riders today', $newUsersToday),
                'accent' => 'sky',
            ],
            [
                'label' => 'Available vehicles',
                'value' => (string) $availableCars,
                'detail' => 'Ready and not under maintenance',
                'trend' => sprintf('%d temporarily offline', $inactiveCars),
                'accent' => 'amber',
            ],
        ];

        $activity = Booking::query()
            ->where('is_approved', true)
            ->with(['user:id,name', 'car:id,name,number'])
            ->latest('updated_at')
            ->limit(5)
            ->get()
            ->map(function (Booking $booking) use ($now) {
                $car = $booking->car;
                $meta = $this->activityMeta($booking->status);
                $passengerName = $booking->user->name ?? $booking->guest_name ?? 'Guest';

                $carTitle = match (true) {
                    $car && $car->name && $car->number => sprintf('%s (%s)', $car->name, $car->number),
                    $car && $car->name => $car->name,
                    $car && $car->number => sprintf('Vehicle %s', $car->number),
                    default => 'Unassigned vehicle',
                };

                return [
                    'title' => sprintf('Trip %s', $carTitle),
                    'time' => optional($booking->updated_at)->diffForHumans($now, true) ?? 'now',
                    'badge' => $meta['badge'],
                    'tone' => $meta['tone'],
                    'description' => sprintf('%s with %s.', $meta['description'], $passengerName),
                ];
            })
            ->values();

        $split = $this->splitBreakdown($totalCars, $availableCars, $activeBookings, $inactiveCars);

        $highlights = $this->highlights($now);

        $statusBreakdown = $this->statusBreakdown($statusCounts);

        $dailyBookings = $this->dailyBookings($now);

        $leaders = $this->topVehicles();

        $meta = [
            'fleet' => $totalCars,
            'available' => $availableCars,
            'activeBookings' => $activeBookings,
            'bookingsToday' => $bookingsToday,
            'newUsersToday' => $newUsersToday,
            'totalUsers' => User::query()->count(),
            'totalDrivers' => Driver::query()->count(),
        ];

        return response()->json([
            'metrics' => $metrics,
            'activity' => $activity,
            'split' => $split,
            'highlights' => $highlights,
            'statusBreakdown' => $statusBreakdown,
            'dailyBookings' => $dailyBookings,
            'leaders' => $leaders,
            'meta' => $meta,
        ]);
    }

    private function activityMeta(?BookingStatus $status): array
    {
        return match ($status) {
            BookingStatus::UPCOMING => [
                'badge' => 'Scheduled',
                'tone' => 'amber',
                'description' => 'Trip queued for dispatch',
            ],
            BookingStatus::ACTIVE => [
                'badge' => 'In progress',
                'tone' => 'sky',
                'description' => 'Driver dispatched and en route',
            ],
            BookingStatus::COMPLETED => [
                'badge' => 'Completed',
                'tone' => 'emerald',
                'description' => 'Trip closed successfully',
            ],
            default => [
                'badge' => 'New booking',
                'tone' => 'sky',
                'description' => 'Request logged moments ago',
            ],
        };
    }

    private function splitBreakdown(int $totalCars, int $availableCars, int $activeBookings, int $inactiveCars): array
    {
        if ($totalCars === 0) {
            return [
                'ready' => 0,
                'enRoute' => 0,
                'maintenance' => 0,
            ];
        }

        $maintenanceCars = min($inactiveCars, $totalCars);
        $enRouteCars = min($activeBookings, max($totalCars - $maintenanceCars, 0));
        $readyCars = max($availableCars, 0);

        $ready = (int) round(($readyCars / $totalCars) * 100);
        $enRoute = (int) round(($enRouteCars / $totalCars) * 100);
        $maintenance = (int) round(($maintenanceCars / $totalCars) * 100);

        $totalPercentage = $ready + $enRoute + $maintenance;

        if ($totalPercentage > 100) {
            $ready -= min($ready, $totalPercentage - 100);
        } elseif ($totalPercentage < 100) {
            $ready += 100 - $totalPercentage;
        }

        return [
            'ready' => max($ready, 0),
            'enRoute' => $enRoute,
            'maintenance' => $maintenance,
        ];
    }

    private function highlights($now): array
    {
        $topCar = Car::query()
            ->withCount(['bookings' => fn ($query) => $query->where('is_approved', true)])
            ->orderByDesc('bookings_count')
            ->first();

        $avgDuration = Booking::query()
            ->where('is_approved', true)
            ->whereNotNull('end_date')
            ->get()
            ->map(fn (Booking $booking) => $booking->start_date->diffInMinutes($booking->end_date))
            ->avg() ?: 0;

        return array_values(array_filter([
            $topCar ? [
                'title' => 'Most requested car',
                'body' => sprintf('%s handled %d confirmed bookings.', $topCar->name, $topCar->bookings_count),
                'icon' => '🚗',
            ] : null,
            [
                'title' => 'Average trip duration',
                'body' => sprintf('%.0f minutes from dispatch to drop-off (last 30 days).', $avgDuration),
                'icon' => '⏱️',
            ],
            [
                'title' => 'Last operational sync',
                'body' => sprintf('Data refreshed at %s.', $now->timezone(config('app.timezone'))->format('H:i')),
                'icon' => '🛰️',
            ],
        ]));
    }

    private function statusBreakdown(array $counts): array
    {
        return [
            [
                'label' => 'Scheduled rides',
                'status' => BookingStatus::UPCOMING->value,
                'count' => (int) ($counts[BookingStatus::UPCOMING->value] ?? 0),
                'tone' => 'amber',
                'detail' => 'Departing soon',
            ],
            [
                'label' => 'Active rides',
                'status' => BookingStatus::ACTIVE->value,
                'count' => (int) ($counts[BookingStatus::ACTIVE->value] ?? 0),
                'tone' => 'sky',
                'detail' => 'Currently en route',
            ],
            [
                'label' => 'Completed trips',
                'status' => BookingStatus::COMPLETED->value,
                'count' => (int) ($counts[BookingStatus::COMPLETED->value] ?? 0),
                'tone' => 'emerald',
                'detail' => 'Closed without incidents',
            ],
        ];
    }

    private function bookingStatusCounts(): array
    {
        $now = now();
        $counts = [];

        foreach (BookingStatus::cases() as $status) {
            $counts[$status->value] = Booking::query()->approved()->status($status, $now)->count();
        }

        return $counts;
    }

    private function dailyBookings($now): array
    {
        $periodStart = $now->clone()->subDays(6)->startOfDay();

        $records = Booking::query()
            ->selectRaw('DATE(start_date) as day, COUNT(*) as total')
            ->whereBetween('start_date', [$periodStart, $now])
            ->where('is_approved', true)
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->mapWithKeys(fn ($row) => [$row->day => (int) $row->total]);

        return collect(range(0, 6))
            ->map(function ($offset) use ($periodStart, $records) {
                $day = $periodStart->clone()->addDays($offset);

                return [
                    'label' => $day->format('D'),
                    'date' => $day->toDateString(),
                    'value' => (int) ($records[$day->toDateString()] ?? 0),
                ];
            })
            ->toArray();
    }

    private function topVehicles(): array
    {
        $now = now();

        return Car::query()
            ->withCount([
                'bookings as completed_bookings_count' => fn ($query) => $query->approved()->status(BookingStatus::COMPLETED, $now),
                'bookings as active_bookings_count' => fn ($query) => $query->approved()->status(BookingStatus::ACTIVE, $now),
            ])
            ->orderByDesc('completed_bookings_count')
            ->limit(3)
            ->get()
            ->map(fn (Car $car) => [
                'name' => $car->name,
                'number' => $car->number,
                'completedTrips' => (int) $car->completed_bookings_count,
                'activeTrips' => (int) $car->active_bookings_count,
                'status' => $car->is_active ? 'Active' : 'Inactive',
            ])
            ->toArray();
    }
}
