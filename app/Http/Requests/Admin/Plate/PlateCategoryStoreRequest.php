<?php

namespace App\Http\Requests\Admin\Plate;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PlateCategoryStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'plate_source_id' => ['required', 'integer', 'exists:plate_sources,id'],
            'title' => [
                'required',
                'string',
                'max:255',
                Rule::unique('plate_categories', 'title')->where('plate_source_id', $this->input('plate_source_id')),
            ],
        ];
    }
}
