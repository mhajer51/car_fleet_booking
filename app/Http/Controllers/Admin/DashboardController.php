<?php

namespace App\Http\Controllers\Admin;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Car;
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
        $activeBookings = Booking::query()->active()->count();
        $bookingsToday = Booking::query()->whereDate('start_date', $today)->count();
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
            ->with(['user:id,name', 'car:id,name,number'])
            ->latest('updated_at')
            ->limit(5)
            ->get()
            ->map(function (Booking $booking) use ($now) {
                $meta = $this->activityMeta($booking->status);

                return [
                    'title' => sprintf('Trip %s (%s)', $booking->car->name, $booking->car->number),
                    'time' => optional($booking->updated_at)->diffForHumans($now, true) ?? 'now',
                    'badge' => $meta['badge'],
                    'tone' => $meta['tone'],
                    'description' => sprintf('%s with %s.', $meta['description'], $booking->user->name),
                ];
            })
            ->values();

        $split = $this->splitBreakdown($totalCars, $availableCars, $activeBookings, $inactiveCars);

        $highlights = $this->highlights($now);

        $statusBreakdown = $this->statusBreakdown();

        $dailyBookings = $this->dailyBookings($now);

        $leaders = $this->topVehicles();

        $meta = [
            'fleet' => $totalCars,
            'available' => $availableCars,
            'activeBookings' => $activeBookings,
            'bookingsToday' => $bookingsToday,
            'newUsersToday' => $newUsersToday,
            'totalUsers' => User::query()->count(),
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
            BookingStatus::ACTIVE => [
                'badge' => 'In progress',
                'tone' => 'sky',
                'description' => 'Driver dispatched and en route',
            ],
            BookingStatus::CLOSED => [
                'badge' => 'Completed',
                'tone' => 'emerald',
                'description' => 'Trip closed successfully',
            ],
            BookingStatus::CANCELLED => [
                'badge' => 'Cancelled',
                'tone' => 'rose',
                'description' => 'Client cancelled the request',
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
            ->withCount('bookings')
            ->orderByDesc('bookings_count')
            ->first();

        $avgDuration = Booking::query()
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

    private function statusBreakdown(): array
    {
        $counts = Booking::query()
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        return [
            [
                'label' => 'Active rides',
                'status' => BookingStatus::ACTIVE->value,
                'count' => (int) ($counts[BookingStatus::ACTIVE->value] ?? 0),
                'tone' => 'sky',
                'detail' => 'Currently en route',
            ],
            [
                'label' => 'Completed trips',
                'status' => BookingStatus::CLOSED->value,
                'count' => (int) ($counts[BookingStatus::CLOSED->value] ?? 0),
                'tone' => 'emerald',
                'detail' => 'Closed without incidents',
            ],
            [
                'label' => 'Cancelled',
                'status' => BookingStatus::CANCELLED->value,
                'count' => (int) ($counts[BookingStatus::CANCELLED->value] ?? 0),
                'tone' => 'rose',
                'detail' => 'Flagged by riders',
            ],
        ];
    }

    private function dailyBookings($now): array
    {
        $periodStart = $now->clone()->subDays(6)->startOfDay();

        $records = Booking::query()
            ->selectRaw('DATE(start_date) as day, COUNT(*) as total')
            ->whereBetween('start_date', [$periodStart, $now])
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
        return Car::query()
            ->withCount([
                'bookings as completed_bookings_count' => fn ($query) => $query->where('status', BookingStatus::CLOSED->value),
                'bookings as active_bookings_count' => fn ($query) => $query->where('status', BookingStatus::ACTIVE->value),
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
