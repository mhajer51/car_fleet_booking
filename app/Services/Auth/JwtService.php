<?php

namespace App\Services\Auth;

use App\Exceptions\InvalidTokenException;
use Illuminate\Support\Str;
use JsonException;
use RuntimeException;

class JwtService
{
    private string $secret;

    public function __construct(?string $secret = null, private int $ttl = 0, private int $refreshTtl = 0)
    {
        $secret ??= config('jwt.secret');

        if (empty($secret)) {
            throw new RuntimeException('JWT secret is not configured.');
        }

        $this->secret = $this->normalizeSecret($secret);
        $this->ttl = $this->ttl > 0 ? $this->ttl : (int) config('jwt.ttl', 3600);
        $this->refreshTtl = $this->refreshTtl > 0 ? $this->refreshTtl : (int) config('jwt.refresh_ttl', 1209600);
    }

    public function createAccessToken(array $claims = []): string
    {
        return $this->createToken($claims + ['type' => 'access'], $this->ttl);
    }

    public function createRefreshToken(array $claims = []): string
    {
        return $this->createToken($claims + ['type' => 'refresh'], $this->refreshTtl);
    }

    private function createToken(array $claims, int $ttl): string
    {
        $header = [
            'alg' => 'HS256',
            'typ' => 'JWT',
        ];

        $issuedAt = now()->timestamp;

        $payload = array_merge([
            'iss' => config('app.url'),
            'iat' => $issuedAt,
            'nbf' => $issuedAt,
            'exp' => $issuedAt + $ttl,
            'jti' => (string) Str::uuid(),
        ], $claims);

        $segments = [
            $this->base64UrlEncode($header),
            $this->base64UrlEncode($payload),
        ];

        $signature = hash_hmac('sha256', implode('.', $segments), $this->secret, true);

        $segments[] = $this->base64UrlEncode($signature, false);

        return implode('.', $segments);
    }

    /**
     * @return array<string, mixed>
     */
    public function validateToken(?string $token, ?string $expectedType = null): array
    {
        if (empty($token)) {
            throw new InvalidTokenException('Token not provided.');
        }

        $segments = explode('.', $token);

        if (count($segments) !== 3) {
            throw new InvalidTokenException('Token is malformed.');
        }

        [$encodedHeader, $encodedPayload, $encodedSignature] = $segments;

        $signature = $this->decodeBase64Url($encodedSignature);
        $expectedSignature = hash_hmac('sha256', $encodedHeader . '.' . $encodedPayload, $this->secret, true);

        if (!hash_equals($expectedSignature, $signature)) {
            throw new InvalidTokenException('Invalid token signature.');
        }

        try {
            /** @var array<string, mixed> $header */
            $header = json_decode($this->decodeBase64Url($encodedHeader), true, 512, JSON_THROW_ON_ERROR);
            /** @var array<string, mixed> $payload */
            $payload = json_decode($this->decodeBase64Url($encodedPayload), true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw new InvalidTokenException('Token is malformed.');
        }

        if (($header['alg'] ?? null) !== 'HS256') {
            throw new InvalidTokenException('Unsupported token algorithm.');
        }

        if (($payload['exp'] ?? 0) < now()->timestamp) {
            throw new InvalidTokenException('Token has expired.');
        }

        if ($expectedType !== null && ($payload['type'] ?? 'access') !== $expectedType) {
            throw new InvalidTokenException('Invalid token type.');
        }

        return $payload;
    }

    public function getTtl(): int
    {
        return $this->ttl;
    }

    public function getRefreshTtl(): int
    {
        return $this->refreshTtl;
    }

    private function normalizeSecret(string $secret): string
    {
        if (str_starts_with($secret, 'base64:')) {
            $decoded = base64_decode(substr($secret, 7), true);

            if ($decoded === false) {
                throw new RuntimeException('Failed to decode JWT secret.');
            }

            return $decoded;
        }

        return $secret;
    }

    private function base64UrlEncode(array|string $data, bool $jsonEncode = true): string
    {
        if ($jsonEncode) {
            $data = json_encode($data, JSON_THROW_ON_ERROR);
        }

        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function decodeBase64Url(string $segment): string
    {
        $remainder = strlen($segment) % 4;
        if ($remainder) {
            $segment .= str_repeat('=', 4 - $remainder);
        }

        $decoded = base64_decode(strtr($segment, '-_', '+/'), true);

        if ($decoded === false) {
            throw new InvalidTokenException('Token is malformed.');
        }

        return $decoded;
    }
}
