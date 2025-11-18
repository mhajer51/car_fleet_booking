<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Plate\PlateCodeStoreRequest;
use App\Http\Requests\Admin\Plate\PlateCodeUpdateRequest;
use App\Models\PlateCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlateCodeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->integer('per_page', 15);
        $perPage = $perPage > 0 ? min($perPage, 100) : 15;

        $search = trim((string) $request->query('search', ''));
        $sourceId = $request->query('plate_source_id');
        $categoryId = $request->query('plate_category_id');

        $query = PlateCode::query()->with(['category.source']);

        if ($sourceId) {
            $query->whereHas('category', fn ($q) => $q->where('plate_source_id', $sourceId));
        }

        if ($categoryId) {
            $query->where('plate_category_id', $categoryId);
        }

        if ($search !== '') {
            $query->where('title', 'like', "%{$search}%");
        }

        $paginator = $query->orderBy('title')->paginate($perPage);

        $codes = $paginator->getCollection()->map(function (PlateCode $code) {
            return [
                'id' => $code->id,
                'title' => $code->title,
                'category' => [
                    'id' => $code->category->id,
                    'title' => $code->category->title,
                ],
                'source' => [
                    'id' => $code->category->source->id,
                    'title' => $code->category->source->title,
                ],
            ];
        });

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

    public function store(PlateCodeStoreRequest $request): JsonResponse
    {
        $code = PlateCode::create($request->validated())->load('category.source');

        return apiResponse('Plate code created successfully.', [
            'code' => [
                'id' => $code->id,
                'title' => $code->title,
                'category' => [
                    'id' => $code->category->id,
                    'title' => $code->category->title,
                ],
                'source' => [
                    'id' => $code->category->source->id,
                    'title' => $code->category->source->title,
                ],
            ],
        ]);
    }

    public function update(PlateCodeUpdateRequest $request, PlateCode $plateCode): JsonResponse
    {
        $plateCode->update($request->validated());
        $plateCode->refresh()->load('category.source');

        return apiResponse('Plate code updated successfully.', [
            'code' => [
                'id' => $plateCode->id,
                'title' => $plateCode->title,
                'category' => [
                    'id' => $plateCode->category->id,
                    'title' => $plateCode->category->title,
                ],
                'source' => [
                    'id' => $plateCode->category->source->id,
                    'title' => $plateCode->category->source->title,
                ],
            ],
        ]);
    }

    public function destroy(PlateCode $plateCode): JsonResponse
    {
        $plateCode->delete();

        return apiResponse('Plate code deleted successfully.');
    }
}
