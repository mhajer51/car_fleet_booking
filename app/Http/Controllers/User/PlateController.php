<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\PlateCategory;
use App\Models\PlateCode;
use App\Models\PlateSource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlateController extends Controller
{
    public function sources(Request $request): JsonResponse
    {
        $perPage = (int) $request->integer('per_page', 15);
        $perPage = $perPage > 0 ? min($perPage, 100) : 15;

        $search = trim((string) $request->query('search', ''));

        $query = PlateSource::query();

        if ($search !== '') {
            $query->where('title', 'like', "%{$search}%");
        }

        $paginator = $query->orderBy('title')->paginate($perPage);

        $sources = $paginator->getCollection()->map(fn (PlateSource $source) => [
            'id' => $source->id,
            'title' => $source->title,
        ]);

        return apiResponse('Plate sources fetched successfully.', [
            'sources' => $sources,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    public function categories(Request $request): JsonResponse
    {
        $perPage = (int) $request->integer('per_page', 15);
        $perPage = $perPage > 0 ? min($perPage, 100) : 15;

        $search = trim((string) $request->query('search', ''));
        $plateSourceId = $request->query('plate_source_id');

        $query = PlateCategory::query()->with('source:id,title');

        if ($plateSourceId) {
            $query->where('plate_source_id', $plateSourceId);
        }

        if ($search !== '') {
            $query->where('title', 'like', "%{$search}%");
        }

        $paginator = $query->orderBy('title')->paginate($perPage);

        $categories = $paginator->getCollection()->map(fn (PlateCategory $category) => [
            'id' => $category->id,
            'title' => $category->title,
            'plate_source_id' => $category->plate_source_id,
            'source' => $category->source?->only(['id', 'title']),
        ]);

        return apiResponse('Plate categories fetched successfully.', [
            'categories' => $categories,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    public function codes(Request $request): JsonResponse
    {
        $perPage = (int) $request->integer('per_page', 15);
        $perPage = $perPage > 0 ? min($perPage, 100) : 15;

        $search = trim((string) $request->query('search', ''));
        $plateSourceId = $request->query('plate_source_id');
        $plateCategoryId = $request->query('plate_category_id');

        $query = PlateCode::query()->with('category:id,title,plate_source_id');

        if ($plateCategoryId) {
            $query->where('plate_category_id', $plateCategoryId);
        }

        if ($plateSourceId) {
            $query->whereHas('category', function ($builder) use ($plateSourceId): void {
                $builder->where('plate_source_id', $plateSourceId);
            });
        }

        if ($search !== '') {
            $query->where('title', 'like', "%{$search}%");
        }

        $paginator = $query->orderBy('title')->paginate($perPage);

        $codes = $paginator->getCollection()->map(fn (PlateCode $code) => [
            'id' => $code->id,
            'title' => $code->title,
            'plate_category_id' => $code->plate_category_id,
            'category' => $code->category?->only(['id', 'title', 'plate_source_id']),
        ]);

        return apiResponse('Plate codes fetched successfully.', [
            'codes' => $codes,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }
}
