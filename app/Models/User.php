<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'username',
        'email',
        'employee_number',
        'password',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'password' => 'hashed',
        ];
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function scopeAvailableForPeriod(Builder $query, Carbon $startDate, ?Carbon $endDate, ?int $excludingBookingId = null): Builder
    {
        $query->where('is_active', true);

        return $query->whereDoesntHave('bookings', function ($builder) use ($startDate, $endDate, $excludingBookingId) {
            $builder->when($excludingBookingId, fn ($inner) => $inner->where('bookings.id', '!=', $excludingBookingId))
                ->overlapping($startDate, $endDate);
        });
    }
}
