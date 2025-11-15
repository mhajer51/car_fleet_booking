<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminLoginRequest;
use App\Models\Admin;
use Illuminate\Http\JsonResponse;

class AuthController extends Controller
{

    public function login(AdminLoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();



    }
}
