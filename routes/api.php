<?php

use App\Http\Controllers\User\AuthController as UserAuthController;
use App\Http\Controllers\User\BookingController;
use App\Http\Controllers\User\CarController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('login/user', [UserAuthController::class, 'login'])
        ->name('api.user.login');
});

