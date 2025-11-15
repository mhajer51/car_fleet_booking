<?php

use App\\Http\\Controllers\\Api\\AuthController;
use Illuminate\\Support\\Facades\\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('login/admin', [AuthController::class, 'loginAdmin'])
        ->name('api.admin.login');
});
