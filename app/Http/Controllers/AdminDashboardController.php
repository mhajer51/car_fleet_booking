<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Http\Requests\Admin\StoreManagedCarRequest;
use App\Http\Requests\Admin\StoreManagedUserRequest;
use App\Models\Booking;
use App\Models\Car;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

class AdminDashboardController extends Controller
{
    public function show(): View
    {
        return view('admin.dashboard', [
            'userCount' => User::count(),
            'carCount' => Car::count(),
            'activeBookingCount' => Booking::where('status', BookingStatus::ACTIVE->value)->count(),
            'recentBookings' => Booking::with(['user', 'car'])->latest()->limit(5)->get(),
        ]);
    }

    public function storeUser(StoreManagedUserRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['role'] = 'user';

        User::create($data);

        return redirect()->route('admin.dashboard')->with('status', 'User created successfully.');
    }

    public function storeCar(StoreManagedCarRequest $request): RedirectResponse
    {
        Car::create($request->validated());

        return redirect()->route('admin.dashboard')->with('status', 'Car created successfully.');
    }
}
