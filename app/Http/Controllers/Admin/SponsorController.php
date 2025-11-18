<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Sponsor\AdminSponsorStoreRequest;
use App\Http\Requests\Admin\Sponsor\AdminSponsorUpdateRequest;
use App\Http\Requests\Admin\ToggleStatusRequest;
use App\Models\Sponsor;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SponsorController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->integer('per_page', 10);
        $perPage = $perPage > 0 ? min($perPage, 100) : 10;

        $search = trim((string) $request->query('search', ''));
        $isActive = $request->query('is_active');

        $query = Sponsor::query();

        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder->where('title', 'like', "%{$search}%")
                    ->orWhere('traffic_file_number', 'like', "%{$search}%");
            });
        }

        if (! is_null($isActive)) {
            $boolean = filter_var($isActive, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if (! is_null($boolean)) {
                $query->where('is_active', $boolean);
            }
        }

        $paginator = $query->latest()->paginate($perPage);

        $sponsors = $paginator->getCollection()->map(fn (Sponsor $sponsor) => $this->transformSponsor($sponsor));

        return apiResponse('Sponsors fetched successfully.', [
            'sponsors' => $sponsors,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    public function store(AdminSponsorStoreRequest $request): JsonResponse
    {
        $data = $request->validated();

        try {
            $sponsor = Sponsor::create([
                'title' => $data['title'],
                'traffic_file_number' => $data['traffic_file_number'],
                'is_active' => $data['is_active'] ?? true,
            ]);
        } catch (QueryException $exception) {
            if ($this->isUniqueViolation($exception)) {
                return apiResponse('Validation failed', [
                    'traffic_file_number' => ['This traffic file number is already registered.'],
                ], 422);
            }

            throw $exception;
        }

        $sponsor = $this->transformSponsor($sponsor);

        return apiResponse('Sponsor created successfully.', compact('sponsor'));
    }

    public function update(AdminSponsorUpdateRequest $request, Sponsor $sponsor): JsonResponse
    {
        $data = $request->validated();

        try {
            $sponsor->update($data);
        } catch (QueryException $exception) {
            if ($this->isUniqueViolation($exception)) {
                return apiResponse('Validation failed', [
                    'traffic_file_number' => ['This traffic file number is already registered.'],
                ], 422);
            }

            throw $exception;
        }

        $sponsor = $this->transformSponsor($sponsor->fresh());

        return apiResponse('Sponsor updated successfully.', compact('sponsor'));
    }

    public function updateStatus(ToggleStatusRequest $request, Sponsor $sponsor): JsonResponse
    {
        $sponsor->update($request->validated());

        $sponsor = $this->transformSponsor($sponsor->fresh());

        return apiResponse('Sponsor status updated successfully.', compact('sponsor'));
    }

    public function destroy(Sponsor $sponsor): JsonResponse
    {
        $sponsor->delete();

        return apiResponse('Sponsor deleted successfully.');
    }

    private function transformSponsor(Sponsor $sponsor): array
    {
        return [
            'id' => $sponsor->id,
            'title' => $sponsor->title,
            'traffic_file_number' => $sponsor->traffic_file_number,
            'is_active' => $sponsor->is_active,
        ];
    }

    private function isUniqueViolation(QueryException $exception): bool
    {
        return in_array($exception->getCode(), ['23000', '23505'], true)
            || in_array($exception->errorInfo[0] ?? null, ['23000', '23505'], true);
    }
}
