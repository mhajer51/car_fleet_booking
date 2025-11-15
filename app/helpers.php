<?php

if (!function_exists('apiResponse')) {
    function apiResponse($message='', $data = [],$status = 200,$errorDetails = null)
    {
        $traceId = app('request')->attributes->get('trace_id', 'uuid-v4');
        if (is_object($data)) {
            $data = method_exists($data, 'toArray') ? $data->toArray() : (array) $data;
        } elseif (is_string($data)) {
            $data = json_decode($data, true);
        }
        $success = substr((string)$status, 0, 1) === '2'; // 200-299 status codes
        $response = [
            'success' => $success,
            'message' => $message,
            'status' => $status,
            'data' => $data,
            "trace_id"=> $traceId
        ];
        if ($errorDetails) {
            $response['error'] = $errorDetails;
        }
        return response()->json($response, $status);
    }
}
