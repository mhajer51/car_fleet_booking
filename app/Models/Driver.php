<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

class Driver extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'license_number',
        'phone_number',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function activeBookings(): HasMany
    {
        return $this->bookings()->active();
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeAvailableForPeriod(Builder $query, Carbon $startDate, ?Carbon $endDate, ?int $excludingBookingId = null): Builder
    {
        return $query->active()->whereDoesntHave('bookings', function ($builder) use ($startDate, $endDate, $excludingBookingId) {
            $builder->when($excludingBookingId, fn ($inner) => $inner->where('bookings.id', '!=', $excludingBookingId))
                ->overlapping($startDate, $endDate);
        });
    }
}
