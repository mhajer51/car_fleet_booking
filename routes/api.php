<?php

use App\\Http\\Controllers\\Api\\AuthController;
use App\\Http\\Controllers\\Api\\BookingController;
use App\\Http\\Controllers\\Api\\CarController;
use Illuminate\\Support\\Facades\\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('login/user', [AuthController::class, 'loginUser'])
        ->name('api.user.login');
});

require __DIR__.'/admin.php';

Route::get('cars/available', [CarController::class, 'available']);

Route::get('bookings', [BookingController::class, 'index']);
Route::post('bookings', [BookingController::class, 'store']);
Route::post('bookings/{booking}/return', [BookingController::class, 'returnCar']);
