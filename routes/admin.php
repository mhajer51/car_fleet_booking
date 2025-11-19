<?php

use App\Http\Controllers\Admin\AuthController as AdminAuthController;
use App\Http\Controllers\Admin\BookingController as AdminBookingController;
use App\Http\Controllers\Admin\CarController as AdminCarController;
use App\Http\Controllers\Admin\DriverController as AdminDriverController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\PlateCategoryController as AdminPlateCategoryController;
use App\Http\Controllers\Admin\PlateCodeController as AdminPlateCodeController;
use App\Http\Controllers\Admin\PlateSourceController as AdminPlateSourceController;
use App\Http\Controllers\Admin\ProfileController as AdminProfileController;
use App\Http\Controllers\Admin\SponsorController as AdminSponsorController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\ViolationController as AdminViolationController;
use App\Models\Admin;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->group(function (): void {
    Route::post('login', [AdminAuthController::class, 'login'])->name('api.admin.login');
    Route::post('refresh', [AdminAuthController::class, 'refresh'])->name('api.admin.refresh');
    Route::get('overview', AdminDashboardController::class)->name('api.admin.overview');

    Route::middleware('jwt:admin,' . Admin::class)->group(function (): void {
        Route::get('dashboard', AdminDashboardController::class)->name('dashboard');

        Route::put('profile', [AdminProfileController::class, 'update'])->name('admin.profile.update');
        Route::put('profile/password', [AdminProfileController::class, 'updatePassword'])->name('admin.profile.update-password');

        Route::prefix('users')->group(function (): void {
            Route::get('/', [AdminUserController::class, 'index'])->name('users.index');
            Route::post('/', [AdminUserController::class, 'store'])->name('users.store');
            Route::put('{user}', [AdminUserController::class, 'update'])->name('users.update');
            Route::patch('{user}/status', [AdminUserController::class, 'updateStatus'])->name('users.update-status');
            Route::delete('{user}', [AdminUserController::class, 'destroy'])->name('users.destroy');
        });

        Route::prefix('cars')->group(function (): void {
            Route::get('/', [AdminCarController::class, 'index'])->name('cars.index');
            Route::post('/', [AdminCarController::class, 'store'])->name('cars.store');
            Route::put('{car}', [AdminCarController::class, 'update'])->name('cars.update');
            Route::patch('{car}/status', [AdminCarController::class, 'updateStatus'])->name('cars.update-status');
            Route::delete('{car}', [AdminCarController::class, 'destroy'])->name('cars.destroy');
        });

        Route::prefix('sponsors')->group(function (): void {
            Route::get('/', [AdminSponsorController::class, 'index'])->name('sponsors.index');
            Route::post('/', [AdminSponsorController::class, 'store'])->name('sponsors.store');
            Route::put('{sponsor}', [AdminSponsorController::class, 'update'])->name('sponsors.update');
            Route::patch('{sponsor}/status', [AdminSponsorController::class, 'updateStatus'])->name('sponsors.update-status');
            Route::delete('{sponsor}', [AdminSponsorController::class, 'destroy'])->name('sponsors.destroy');
        });

        Route::prefix('drivers')->group(function (): void {
            Route::get('/', [AdminDriverController::class, 'index'])->name('drivers.index');
            Route::post('/', [AdminDriverController::class, 'store'])->name('drivers.store');
            Route::put('{driver}', [AdminDriverController::class, 'update'])->name('drivers.update');
            Route::patch('{driver}/status', [AdminDriverController::class, 'updateStatus'])->name('drivers.update-status');
        });

        Route::prefix('plates')->group(function (): void {
            Route::get('sources', [AdminPlateSourceController::class, 'index'])->name('plates.sources.index');
            Route::post('sources', [AdminPlateSourceController::class, 'store'])->name('plates.sources.store');
            Route::put('sources/{plate_source}', [AdminPlateSourceController::class, 'update'])->name('plates.sources.update');
            Route::delete('sources/{plate_source}', [AdminPlateSourceController::class, 'destroy'])->name('plates.sources.destroy');

            Route::get('categories', [AdminPlateCategoryController::class, 'index'])->name('plates.categories.index');
            Route::post('categories', [AdminPlateCategoryController::class, 'store'])->name('plates.categories.store');
            Route::put('categories/{plate_category}', [AdminPlateCategoryController::class, 'update'])->name('plates.categories.update');
            Route::delete('categories/{plate_category}', [AdminPlateCategoryController::class, 'destroy'])->name('plates.categories.destroy');

            Route::get('codes', [AdminPlateCodeController::class, 'index'])->name('plates.codes.index');
            Route::post('codes', [AdminPlateCodeController::class, 'store'])->name('plates.codes.store');
            Route::put('codes/{plate_code}', [AdminPlateCodeController::class, 'update'])->name('plates.codes.update');
            Route::delete('codes/{plate_code}', [AdminPlateCodeController::class, 'destroy'])->name('plates.codes.destroy');
        });

        Route::post('violations/search', [AdminViolationController::class, 'search'])->name('violations.search');

        Route::prefix('bookings')->group(function (): void {
            Route::get('/', [AdminBookingController::class, 'index'])->name('bookings.index');
            Route::post('/', [AdminBookingController::class, 'store'])->name('bookings.store');
            Route::put('{booking}', [AdminBookingController::class, 'update'])->name('bookings.update');
            Route::patch('{booking}/approval', [AdminBookingController::class, 'updateApproval'])->name('bookings.update-approval');

            Route::get('available/users', [AdminBookingController::class, 'availableUsers'])->name('bookings.available-users');
            Route::get('available/cars', [AdminBookingController::class, 'availableCars'])->name('bookings.available-cars');
            Route::get('available/drivers', [AdminBookingController::class, 'availableDrivers'])->name('bookings.available-drivers');
        });
    });

});

