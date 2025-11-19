<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

class Car extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'model',
        'color',
        'number',
        'plate_source_id',
        'plate_category_id',
        'plate_code_id',
        'notes',
        'is_company_owned',
        'sponsor_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_company_owned' => 'boolean',
    ];

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function plateSource()
    {
        return $this->belongsTo(PlateSource::class);
    }

    public function plateCategory()
    {
        return $this->belongsTo(PlateCategory::class);
    }

    public function plateCode()
    {
        return $this->belongsTo(PlateCode::class);
    }

    public function sponsor(): BelongsTo
    {
        return $this->belongsTo(Sponsor::class);
    }

    public function activeBookings(): HasMany
    {
        return $this->bookings()->active();
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeAvailable($query)
    {
        return $query->active()->whereDoesntHave('bookings', function ($query) {
            $query->active();
        });
    }

    public function scopeAvailableForPeriod(Builder $query, Carbon $startDate, ?Carbon $endDate, ?int $excludingBookingId = null): Builder
    {
        return $query->active()->whereDoesntHave('bookings', function ($builder) use ($startDate, $endDate, $excludingBookingId) {
            $builder->when($excludingBookingId, fn ($inner) => $inner->where('bookings.id', '!=', $excludingBookingId))
                ->overlapping($startDate, $endDate);
        });
    }
}
