<?php

use App\Http\Controllers\Admin\AuthController as AdminAuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('login/admin', [AdminAuthController::class, 'login'])
        ->name('api.admin.login');
});
