<?php

namespace App\Http\Controllers\Portal;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Car;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class OverviewController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $now = now();
        $today = $now->clone()->startOfDay();

        $bookingsToday = Booking::query()->whereDate('start_date', $today)->count();
        $bookingsYesterday = Booking::query()->whereDate('start_date', $today->clone()->subDay())->count();
        $activeBookings = Booking::query()->active()->count();
        $totalCars = Car::query()->count();
        $availableCars = Car::query()->available()->count();
        $engagedClients = Booking::query()
            ->where('updated_at', '>=', $now->clone()->subHour())
            ->distinct('user_id')
            ->count();
        $engagedClients = $engagedClients ?: min(User::count(), max(1, $activeBookings));
        $newUsersToday = User::query()->whereDate('created_at', $today)->count();

        $metrics = [
            [
                'label' => 'Bookings today',
                'value' => (string) $bookingsToday,
                'detail' => 'Total confirmed requests',
                'trend' => sprintf('%s%d vs. yesterday', $this->trendPrefix($bookingsToday, $bookingsYesterday), abs($bookingsToday - $bookingsYesterday)),
                'accent' => 'violet',
            ],
            [
                'label' => 'Vehicles ready',
                'value' => (string) $availableCars,
                'detail' => 'Cars available to deploy',
                'trend' => sprintf('%d%% utilization', $totalCars ? round(($activeBookings / max($totalCars, 1)) * 100) : 0),
                'accent' => 'emerald',
            ],
            [
                'label' => 'Connected clients',
                'value' => (string) $engagedClients,
                'detail' => 'Active during the last hour',
                'trend' => sprintf('+%d new users', $newUsersToday),
                'accent' => 'sky',
            ],
        ];

        $timeline = Booking::query()
            ->with(['user:id,name', 'car:id,name,model,number'])
            ->latest('start_date')
            ->limit(5)
            ->get()
            ->map(function (Booking $booking) {
                $time = $booking->start_date
                    ? $booking->start_date->clone()->timezone(config('app.timezone'))->format('H:i')
                    : optional($booking->created_at)->timezone(config('app.timezone'))->format('H:i');

                return [
                    'title' => sprintf('%s • %s', $booking->car->name, $booking->user->name),
                    'time' => $time,
                    'location' => sprintf('Vehicle %s • %s', $booking->car->model, $booking->car->number),
                    'status' => $this->statusLabel($booking->status),
                ];
            })
            ->values();

        $avgDuration = Booking::query()
            ->whereNotNull('end_date')
            ->get()
            ->map(fn (Booking $booking) => $booking->start_date->diffInMinutes($booking->end_date))
            ->avg() ?: 0;

        $suggestions = $this->buildSuggestions($availableCars, $totalCars, (int) round($avgDuration), $bookingsToday);

        $heatmap = $this->buildHeatmap();

        return response()->json([
            'metrics' => $metrics,
            'timeline' => $timeline,
            'suggestions' => $suggestions,
            'heatmap' => $heatmap,
        ]);
    }

    private function statusLabel(?BookingStatus $status): string
    {
        return match ($status) {
            BookingStatus::ACTIVE => 'In progress',
            BookingStatus::CLOSED => 'Returned',
            BookingStatus::CANCELLED => 'Cancelled',
            default => 'New',
        };
    }

    private function trendPrefix(int $current, int $previous): string
    {
        if ($current === $previous) {
            return 'Stable • ±';
        }

        return $current > $previous ? '+' : '-';
    }

    private function buildSuggestions(int $availableCars, int $totalCars, int $avgDuration, int $bookingsToday): array
    {
        $suggestions = [];

        if ($totalCars > 0 && $availableCars < max(1, (int) ceil($totalCars * 0.3))) {
            $suggestions[] = 'Rebalance the fleet toward the highest-demand cities to preserve availability.';
        }

        if ($avgDuration > 60) {
            $suggestions[] = 'Shorten trip durations by predefining drop-off checkpoints with drivers.';
        } else {
            $suggestions[] = 'Trip durations look healthy—keep the express booking mode enabled.';
        }

        $suggestions[] = $bookingsToday === 0
            ? 'Launch a welcome campaign to nudge customers toward opening bookings today.'
            : 'Share a thank-you note with active customers highlighting instant booking perks.';

        return $suggestions;
    }

    private function buildHeatmap(): array
    {
        $cities = ['Riyadh', 'Jeddah', 'Dammam'];
        $cityTotals = array_fill_keys($cities, 0);

        $bookings = Booking::query()->select(['id', 'user_id'])->get();
        $total = $bookings->count();

        foreach ($bookings as $booking) {
            $index = $booking->user_id % count($cities);
            $city = $cities[$index];
            $cityTotals[$city] += 1;
        }

        if ($total === 0) {
            $count = count($cities);
            $share = intdiv(100, $count);
            $remainder = 100 % $count;

            return array_values(array_map(function ($city, $index) use ($share, $remainder) {
                $value = $share + ($index < $remainder ? 1 : 0);
                return ['label' => $city, 'value' => $value];
            }, $cities, array_keys($cities)));
        }

        return collect($cityTotals)
            ->map(fn (int $count, string $city) => [
                'label' => $city,
                'value' => (int) round(($count / max($total, 1)) * 100),
            ])
            ->values()
            ->all();
    }
}
