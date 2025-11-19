<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ViolationSearchRequest;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ViolationController extends Controller
{
    public function search(ViolationSearchRequest $request): JsonResponse
    {
        $payload = $request->validated();
        $payload['searchBy'] = 'PlateDetails';
        $payload['language'] = $payload['language'] ?? 'en';

        $baseUrl = rtrim((string) config('violations.base_url'), '/');
        $path = '/' . ltrim((string) config('violations.search_path'), '/');
        $timeout = (int) config('violations.timeout', 15);

        try {
            $response = Http::acceptJson()
                ->baseUrl($baseUrl)
                ->timeout($timeout)
                ->post($path, $payload);
        } catch (ConnectionException $exception) {
            Log::error('Unable to reach RTA violations service.', [
                'error' => $exception->getMessage(),
            ]);

            return apiResponse(
                'Unable to reach RTA violations service at the moment. Please try again shortly.',
                [],
                504,
                ['exception' => $exception->getMessage()],
            );
        }

        if ($response->successful()) {
            return apiResponse('Violations fetched successfully.', $response->json() ?? $response->body());
        }

        $body = $response->json() ?? $response->body();
        $message = data_get($body, 'message')
            ?? 'RTA violation lookup failed. Please try again later.';

        Log::warning('RTA violations search failed.', [
            'status' => $response->status(),
            'body' => $body,
        ]);

        return apiResponse($message, is_array($body) ? $body : ['body' => $body], $response->status());
    }
}
