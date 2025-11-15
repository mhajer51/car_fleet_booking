<?php

use App\Http\Controllers\AdminDashboardController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/admin', [AdminDashboardController::class, 'show'])->name('admin.dashboard');
Route::post('/admin/users', [AdminDashboardController::class, 'storeUser'])->name('admin.users.store');
Route::post('/admin/cars', [AdminDashboardController::class, 'storeCar'])->name('admin.cars.store');
