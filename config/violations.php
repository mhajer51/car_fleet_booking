<?php

return [
    'base_url' => rtrim(env('RTA_VIOLATIONS_BASE_URL', 'https://comgw.rta.ae/comgw/cvs/api/public'), '/'),
    'search_path' => env('RTA_VIOLATIONS_SEARCH_PATH', '/search-by-plate'),
    'timeout' => (int) env('RTA_VIOLATIONS_TIMEOUT', 15),

    'authorization' => env('RTA_VIOLATIONS_AUTHORIZATION'),
    'origin' => env('RTA_VIOLATIONS_ORIGIN', 'https://ums.rta.ae'),
    'referer' => env('RTA_VIOLATIONS_REFERER', 'https://ums.rta.ae/violations/public-fines/fines-search'),
    'user_agent' => env('RTA_VIOLATIONS_USER_AGENT'),
    'accept_language' => env('RTA_VIOLATIONS_ACCEPT_LANGUAGE', 'en-GB,en-US;q=0.9,en;q=0.8'),

    'encrypt_payload' => filter_var(env('RTA_VIOLATIONS_ENCRYPT_PAYLOAD', false), FILTER_VALIDATE_BOOL),
    'encryption' => [
        'cipher' => env('RTA_VIOLATIONS_ENCRYPTION_CIPHER', 'aes-256-cbc'),
        'key' => env('RTA_VIOLATIONS_ENCRYPTION_KEY'),
        'iv' => env('RTA_VIOLATIONS_ENCRYPTION_IV'),
        'key_is_base64' => filter_var(env('RTA_VIOLATIONS_ENCRYPTION_KEY_IS_BASE64', true), FILTER_VALIDATE_BOOL),
        'iv_is_base64' => filter_var(env('RTA_VIOLATIONS_ENCRYPTION_IV_IS_BASE64', true), FILTER_VALIDATE_BOOL),
    ],
];
