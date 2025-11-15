<?php

use App\Http\Controllers\Admin\AuthController as AdminAuthController;
use App\Http\Controllers\Admin\BookingController as AdminBookingController;
use App\Http\Controllers\Admin\CarController as AdminCarController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Models\Admin;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->group(function (): void {
    Route::post('login', [AdminAuthController::class, 'login'])->name('api.admin.login');
    Route::get('overview', AdminDashboardController::class)->name('api.admin.overview');

    Route::middleware('jwt:admin,' . Admin::class)->group(function (): void {
        Route::get('dashboard', AdminDashboardController::class)->name('dashboard');

        Route::prefix('users')->group(function (): void {
            Route::get('/', [AdminUserController::class, 'index'])->name('users.index');
            Route::post('/', [AdminUserController::class, 'store'])->name('users.store');
            Route::put('{user}', [AdminUserController::class, 'update'])->name('users.update');
            Route::patch('{user}/status', [AdminUserController::class, 'updateStatus'])->name('users.update-status');
        });

        Route::prefix('cars')->group(function (): void {
            Route::get('/', [AdminCarController::class, 'index'])->name('cars.index');
            Route::post('/', [AdminCarController::class, 'store'])->name('cars.store');
            Route::put('{car}', [AdminCarController::class, 'update'])->name('cars.update');
            Route::patch('{car}/status', [AdminCarController::class, 'updateStatus'])->name('cars.update-status');
        });

        Route::get('bookings', [AdminBookingController::class, 'index'])->name('bookings.index');
        Route::post('bookings', [AdminBookingController::class, 'store'])->name('bookings.store');
    });

});

