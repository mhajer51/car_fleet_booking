<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ViolationSearchRequest;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;

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
            $body = $this->preparePayload($payload);
        } catch (RuntimeException $exception) {
            Log::error('Failed to build encrypted payload for RTA violations search.', [
                'error' => $exception->getMessage(),
            ]);

            return apiResponse(
                'Unable to prepare a request for the violations lookup service. Please verify the encryption settings.',
                [],
                500,
                ['exception' => $exception->getMessage()],
            );
        }

        try {
            $http = Http::acceptJson()
                ->baseUrl($baseUrl)
                ->timeout($timeout);

            $headers = $this->buildHeaders();
            if ($headers) {
                $http = $http->withHeaders($headers);
            }

            $response = $http->post($path, $body);
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

    /**
     * Build the HTTP headers that emulate the official RTA fines portal.
     */
    protected function buildHeaders(): array
    {
        $headers = array_filter([
            'Origin' => config('violations.origin'),
            'Referer' => config('violations.referer'),
            'User-Agent' => config('violations.user_agent'),
            'Accept-Language' => config('violations.accept_language'),
        ]);

        $authorization = trim((string) config('violations.authorization'));
        if ($authorization !== '') {
            if (!Str::startsWith(Str::lower($authorization), 'bearer ')) {
                $authorization = 'Bearer ' . $authorization;
            }

            $headers['Authorization'] = $authorization;
        }

        return $headers;
    }

    /**
     * Encrypt the payload when the upstream requires the obfuscated `_data` format.
     */
    protected function preparePayload(array $payload): array
    {
        if (!config('violations.encrypt_payload')) {
            return $payload;
        }

        $cipher = config('violations.encryption.cipher', 'aes-256-cbc');
        $key = $this->decodeSecret(
            config('violations.encryption.key'),
            (bool) config('violations.encryption.key_is_base64', true)
        );
        $iv = $this->decodeSecret(
            config('violations.encryption.iv'),
            (bool) config('violations.encryption.iv_is_base64', true)
        );

        if (!$key || !$iv) {
            throw new RuntimeException('Encryption key or IV is missing.');
        }

        $jsonPayload = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if ($jsonPayload === false) {
            throw new RuntimeException('Unable to encode payload.');
        }

        $encrypted = openssl_encrypt($jsonPayload, $cipher, $key, OPENSSL_RAW_DATA, $iv);

        if ($encrypted === false) {
            throw new RuntimeException('Unable to encrypt payload with the provided cipher.');
        }

        return ['_data' => base64_encode($encrypted)];
    }

    protected function decodeSecret(?string $secret, bool $isBase64 = true): ?string
    {
        if (!$secret) {
            return null;
        }

        if ($isBase64) {
            $decoded = base64_decode($secret, true);
            if ($decoded === false) {
                throw new RuntimeException('Failed to base64 decode the provided secret.');
            }

            return $decoded;
        }

        return $secret;
    }
}
