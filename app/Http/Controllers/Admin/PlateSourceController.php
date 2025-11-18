<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Plate\PlateSourceStoreRequest;
use App\Http\Requests\Admin\Plate\PlateSourceUpdateRequest;
use App\Models\PlateSource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlateSourceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->integer('per_page', 15);
        $perPage = $perPage > 0 ? min($perPage, 100) : 15;

        $search = trim((string) $request->query('search', ''));

        $query = PlateSource::query();

        if ($search !== '') {
            $query->where('title', 'like', "%{$search}%");
        }

        $paginator = $query->orderBy('title')->paginate($perPage);

        $sources = $paginator->getCollection()->map(function (PlateSource $source) {
            return [
                'id' => $source->id,
                'title' => $source->title,
            ];
        });

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

    public function store(PlateSourceStoreRequest $request): JsonResponse
    {
        $source = PlateSource::create($request->validated());

        return apiResponse('Plate source created successfully.', [
            'source' => [
                'id' => $source->id,
                'title' => $source->title,
            ],
        ]);
    }

    public function update(PlateSourceUpdateRequest $request, PlateSource $plateSource): JsonResponse
    {
        $plateSource->update($request->validated());

        return apiResponse('Plate source updated successfully.', [
            'source' => [
                'id' => $plateSource->id,
                'title' => $plateSource->title,
            ],
        ]);
    }

    public function destroy(PlateSource $plateSource): JsonResponse
    {
        if ($plateSource->categories()->exists()) {
            return apiResponse('Cannot delete a source with categories attached.', [], 422);
        }

        $plateSource->delete();

        return apiResponse('Plate source deleted successfully.');
    }
}
