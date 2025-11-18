<?php

namespace App\Http\Requests\Admin\Plate;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PlateCategoryUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $categoryId = $this->route('plate_category');

        return [
            'plate_source_id' => ['required', 'integer', 'exists:plate_sources,id'],
            'title' => [
                'required',
                'string',
                'max:255',
                Rule::unique('plate_categories', 'title')
                    ->where('plate_source_id', $this->input('plate_source_id'))
                    ->ignore($categoryId),
            ],
        ];
    }
}
