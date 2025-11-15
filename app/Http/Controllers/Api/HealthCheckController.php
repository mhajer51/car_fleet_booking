<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HealthCheckController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $role = $request->query('role', 'guest');

        return response()->json([
            'ok' => true,
            'role' => $role,
            'latency' => random_int(40, 180),
            'refreshedAt' => now()->toIso8601String(),
        ]);
    }
}
