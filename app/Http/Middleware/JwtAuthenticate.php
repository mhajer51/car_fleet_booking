<?php

namespace App\Http\Middleware;

use App\Exceptions\InvalidTokenException;
use App\Services\Auth\JwtService;
use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class JwtAuthenticate
{
    public function __construct(private readonly JwtService $jwtService)
    {
    }

    public function handle(Request $request, Closure $next, string $role, string $modelClass): Response
    {
        try {
            $payload = $this->jwtService->validateToken($request->bearerToken(), 'access');
        } catch (InvalidTokenException $exception) {
            return apiResponse('Unauthorized', [], 401, ['token' => $exception->getMessage()]);
        }

        if (($payload['role'] ?? null) !== $role) {
            return apiResponse('Unauthorized', [], 401);
        }

        if (!class_exists($modelClass)) {
            return apiResponse('Unauthorized', [], 401);
        }

        /** @var Model|null $user */
        $user = $modelClass::query()->find($payload['sub'] ?? null);

        if (!$user || !($user->is_active ?? false)) {
            return apiResponse('Unauthorized', [], 401);
        }

        $request->setUserResolver(fn () => $user);
        $request->attributes->set('token_payload', $payload);

        return $next($request);
    }
}
