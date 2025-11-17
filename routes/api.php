<?php

use App\Http\Controllers\Api\HealthCheckController;
use App\Http\Controllers\Portal\OverviewController as PortalOverviewController;
use App\Http\Controllers\User\AuthController as UserAuthController;
use App\Http\Controllers\User\BookingController;
use App\Http\Controllers\User\CarController;
use App\Http\Controllers\User\DriverController;
use App\Http\Controllers\User\ProfileController;
use App\Models\User;
use Illuminate\Support\Facades\Route;


Route::get('health', HealthCheckController::class)->name('api.health');

Route::prefix('portal')->group(function (): void {
    Route::get('overview', PortalOverviewController::class)->name('api.portal.overview');
});


Route::prefix('user')->group(function (): void {

    Route::post('/', [UserAuthController::class, 'login'])->name('api.user.login');
    Route::post('refresh', [UserAuthController::class, 'refresh'])->name('api.user.refresh');


    Route::middleware('jwt:user,' . User::class)->group(function (): void {
        Route::get('bookings', [BookingController::class, 'index']);
        Route::post('bookings', [BookingController::class, 'store']);
        Route::put('bookings/{booking}', [BookingController::class, 'update']);
        Route::post('bookings/{booking}/return', [BookingController::class, 'returnCar']);
        Route::get('bookings/available/users', [BookingController::class, 'availableUsers']);
        Route::get('bookings/available/cars', [BookingController::class, 'availableCars']);
        Route::get('bookings/available/drivers', [BookingController::class, 'availableDrivers']);

        Route::get('cars', [CarController::class, 'index']);
        Route::post('cars', [CarController::class, 'store']);
        Route::get('cars/available', [CarController::class, 'available']);

        Route::get('drivers', [DriverController::class, 'index']);
        Route::post('drivers', [DriverController::class, 'store']);

        Route::put('profile', [ProfileController::class, 'update']);
        Route::put('profile/password', [ProfileController::class, 'updatePassword']);

    });
});
