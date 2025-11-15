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
                'label' => 'معدل إشغال الأسطول',
                'value' => sprintf('%d%%', $totalCars ? round(($activeBookings / max($totalCars, 1)) * 100) : 0),
                'detail' => 'مقارنة بعدد المركبات الجاهزة',
                'trend' => sprintf('%d مركبة نشطة الآن', $activeBookings),
                'accent' => 'emerald',
            ],
            [
                'label' => 'حجوزات اليوم',
                'value' => (string) $bookingsToday,
                'detail' => 'طلبات مسجلة منذ الصباح',
                'trend' => sprintf('+%d عملاء جدد', $newUsersToday),
                'accent' => 'sky',
            ],
            [
                'label' => 'مركبات متاحة',
                'value' => (string) $availableCars,
                'detail' => 'خارج حالة الصيانة',
                'trend' => sprintf('%d تحت الصيانة', $inactiveCars),
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
                    'title' => sprintf('رحلة %s (%s)', $booking->car->name, $booking->car->number),
                    'time' => optional($booking->updated_at)->diffForHumans($now, true) ?? 'الآن',
                    'badge' => $meta['badge'],
                    'tone' => $meta['tone'],
                    'description' => sprintf('%s مع %s.', $meta['description'], $booking->user->name),
                ];
            })
            ->values();

        $split = $this->splitBreakdown($totalCars, $availableCars, $activeBookings, $inactiveCars);

        $highlights = $this->highlights($now);

        return response()->json([
            'metrics' => $metrics,
            'activity' => $activity,
            'split' => $split,
            'highlights' => $highlights,
        ]);
    }

    private function activityMeta(?BookingStatus $status): array
    {
        return match ($status) {
            BookingStatus::ACTIVE => [
                'badge' => 'قيد التنفيذ',
                'tone' => 'sky',
                'description' => 'تم إرسال السائق وهو في الطريق',
            ],
            BookingStatus::CLOSED => [
                'badge' => 'أُنجزت',
                'tone' => 'emerald',
                'description' => 'أُغلقت الرحلة بنجاح',
            ],
            BookingStatus::CANCELLED => [
                'badge' => 'ألغيت',
                'tone' => 'rose',
                'description' => 'تم إلغاء الحجز من العميل',
            ],
            default => [
                'badge' => 'مُستحدث',
                'tone' => 'sky',
                'description' => 'تم تسجيل الحجز للتو',
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
                'title' => 'السيارة الأكثر طلباً',
                'body' => sprintf('%s سجلت %d حجوزات مؤكدة.', $topCar->name, $topCar->bookings_count),
                'icon' => '🚗',
            ] : null,
            [
                'title' => 'متوسط زمن الرحلة',
                'body' => sprintf('%.0f دقيقة بين الانطلاق والوصول خلال آخر 30 يوماً.', $avgDuration),
                'icon' => '⏱️',
            ],
            [
                'title' => 'آخر تحديث تشغيلي',
                'body' => sprintf('تمت مزامنة البيانات في %s.', $now->timezone(config('app.timezone'))->format('H:i')), 
                'icon' => '🛰️',
            ],
        ]));
    }
}
