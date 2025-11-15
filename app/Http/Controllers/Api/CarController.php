<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Car;
use Illuminate\Http\JsonResponse;

class CarController extends Controller
{
    public function available(): JsonResponse
    {
        $cars = Car::query()
            ->available()
            ->orderBy('name')
            ->get(['id', 'name', 'model', 'color', 'number']);

        return response()->json(['data' => $cars]);
    }
}
