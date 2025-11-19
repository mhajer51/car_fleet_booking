<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Sponsor;
use Illuminate\Http\JsonResponse;

class SponsorController extends Controller
{
    public function index(): JsonResponse
    {
        $sponsors = Sponsor::query()
            ->where('is_active', true)
            ->orderBy('title')
            ->get(['id', 'title']);

        return apiResponse('Sponsors fetched successfully.', compact('sponsors'));
    }
}
