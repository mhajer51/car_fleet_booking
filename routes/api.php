<?php

use App\Http\Controllers\Api\HealthCheckController;
use App\Http\Controllers\Portal\OverviewController as PortalOverviewController;
use App\Http\Controllers\User\AuthController as UserAuthController;
use App\Http\Controllers\User\BookingController;
use App\Http\Controllers\User\CarController;
use App\Models\User;
use Illuminate\Support\Facades\Route;


Route::get('health', HealthCheckController::class)->name('api.health');

Route::prefix('portal')->group(function (): void {
    Route::get('overview', PortalOverviewController::class)->name('api.portal.overview');
});


Route::prefix('user')->group(function (): void {

    Route::post('/', [UserAuthController::class, 'login'])->name('api.user.login');


    Route::middleware('jwt:user,' . User::class)->group(function (): void {
        Route::get('bookings', [BookingController::class, 'index']);
        Route::post('bookings', [BookingController::class, 'store']);
        Route::post('bookings/{booking}/return', [BookingController::class, 'returnCar']);

        Route::get('cars/available', [CarController::class, 'available']);

    });
});
