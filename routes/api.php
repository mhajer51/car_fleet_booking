<?php

use App\Http\Controllers\User\AuthController as UserAuthController;
use App\Http\Controllers\User\BookingController;
use App\Http\Controllers\User\CarController;
use Illuminate\Support\Facades\Route;


Route::prefix('user')->group(function (): void {

    Route::post('/', [UserAuthController::class, 'login'])->name('api.user.login');

    Route::get('cars/available', [CarController::class, 'available']);

    Route::get('bookings', [BookingController::class, 'index']);
    Route::post('bookings', [BookingController::class, 'store']);
    Route::post('bookings/{booking}/return', [BookingController::class, 'returnCar']);

});
