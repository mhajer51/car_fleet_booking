<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Plate\PlateCategoryStoreRequest;
use App\Http\Requests\Admin\Plate\PlateCategoryUpdateRequest;
use App\Models\PlateCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlateCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->integer('per_page', 15);
        $perPage = $perPage > 0 ? min($perPage, 100) : 15;

        $search = trim((string) $request->query('search', ''));
        $sourceId = $request->query('plate_source_id');

        $query = PlateCategory::query()->with('source');

        if ($sourceId) {
            $query->where('plate_source_id', $sourceId);
        }

        if ($search !== '') {
            $query->where('title', 'like', "%{$search}%");
        }

        $paginator = $query->orderBy('title')->paginate($perPage);

        $categories = $paginator->getCollection()->map(function (PlateCategory $category) {
            return [
                'id' => $category->id,
                'title' => $category->title,
                'source' => [
                    'id' => $category->source->id,
                    'title' => $category->source->title,
                ],
            ];
        });

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

    public function store(PlateCategoryStoreRequest $request): JsonResponse
    {
        $category = PlateCategory::create($request->validated())->load('source');

        return apiResponse('Plate category created successfully.', [
            'category' => [
                'id' => $category->id,
                'title' => $category->title,
                'source' => [
                    'id' => $category->source->id,
                    'title' => $category->source->title,
                ],
            ],
        ]);
    }

    public function update(PlateCategoryUpdateRequest $request, PlateCategory $plateCategory): JsonResponse
    {
        $plateCategory->update($request->validated());
        $plateCategory->refresh()->load('source');

        return apiResponse('Plate category updated successfully.', [
            'category' => [
                'id' => $plateCategory->id,
                'title' => $plateCategory->title,
                'source' => [
                    'id' => $plateCategory->source->id,
                    'title' => $plateCategory->source->title,
                ],
            ],
        ]);
    }

    public function destroy(PlateCategory $plateCategory): JsonResponse
    {
        if ($plateCategory->codes()->exists()) {
            return apiResponse('Cannot delete a category with plate codes attached.', [], 422);
        }

        $plateCategory->delete();

        return apiResponse('Plate category deleted successfully.');
    }
}
