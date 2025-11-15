<?php

namespace App\Http\Controllers\User;

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


        return apiResponse('successfully.',compact('cars'));

    }
}
