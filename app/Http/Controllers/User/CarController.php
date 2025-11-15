<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Car;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class CarController extends Controller
{
    public function available(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $startDate = Carbon::parse($validated['start_date']);
        $endDate = isset($validated['end_date']) ? Carbon::parse($validated['end_date']) : null;

        $cars = Car::query()
            ->active()
            ->whereDoesntHave('bookings', function ($query) use ($startDate, $endDate) {
                $query->active()->overlapping($startDate, $endDate);
            })
            ->orderBy('name')
            ->get(['id', 'name', 'model', 'color', 'number']);

        return apiResponse('successfully.', compact('cars'));
    }
}
