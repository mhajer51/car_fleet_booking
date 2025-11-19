<?php

return [
    'base_url' => rtrim(env('RTA_VIOLATIONS_BASE_URL', 'https://ums.rta.ae/violations/public-fines'), '/'),
    'search_path' => env('RTA_VIOLATIONS_SEARCH_PATH', '/api/v1/violations/search'),
    'timeout' => (int) env('RTA_VIOLATIONS_TIMEOUT', 15),
];
