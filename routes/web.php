<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('dashboard', [
        'page' => 'portal',
        'mode' => 'login',
    ]);
})->name('portal.login');

Route::view('/portal/dashboard', 'dashboard', [
    'page' => 'portal',
    'mode' => 'dashboard',
])->name('portal.dashboard');

Route::view('/admin/login', 'dashboard', [
    'page' => 'admin',
    'mode' => 'login',
])->name('admin.login');

Route::view('/admin', 'dashboard', [
    'page' => 'admin',
    'mode' => 'dashboard',
])->name('admin.dashboard');
