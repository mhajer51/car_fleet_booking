<?php

namespace App\Models;

use App\Enums\BookingStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Database\Eloquent\Builder;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'guest_name',
        'car_id',
        'driver_id',
        'price',
        'start_date',
        'end_date',
        'note',
        'is_approved',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'is_approved' => 'boolean',
    ];

    protected $appends = ['status'];

    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('is_approved', true);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    public function scopeActive(Builder $query)
    {
        return $query->approved()->status(BookingStatus::ACTIVE);
    }

    public function scopeStatus(Builder $query, BookingStatus $status, ?Carbon $reference = null)
    {
        $reference ??= Carbon::now();

        return match ($status) {
            BookingStatus::UPCOMING => $query->where('start_date', '>', $reference),
            BookingStatus::ACTIVE => $query
                ->where('start_date', '<=', $reference)
                ->where(function ($builder) use ($reference) {
                    $builder->whereNull('end_date')
                        ->orWhere('end_date', '>=', $reference);
                }),
            BookingStatus::COMPLETED => $query
                ->whereNotNull('end_date')
                ->where('end_date', '<=', $reference),
        };
    }

    public function scopeOverlapping($query, Carbon $startDate, ?Carbon $endDate)
    {
        $requestedEnd = $endDate ?? Carbon::create(9999, 12, 31, 23, 59, 59);

        return $query->approved()->where('start_date', '<=', $requestedEnd)
            ->where(function ($query) use ($startDate) {
                $query->whereNull('end_date')
                    ->orWhere('end_date', '>=', $startDate);
            });
    }

    public function getStatusAttribute(): BookingStatus
    {
        $start = $this->start_date instanceof Carbon ? $this->start_date : Carbon::parse($this->start_date);
        $end = $this->end_date instanceof Carbon || is_null($this->end_date)
            ? $this->end_date
            : Carbon::parse($this->end_date);

        return BookingStatus::fromDates($start, $end);
    }
}
