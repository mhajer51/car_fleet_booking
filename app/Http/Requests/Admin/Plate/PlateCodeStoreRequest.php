<?php

namespace App\Http\Requests\Admin\Plate;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PlateCodeStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'plate_category_id' => ['required', 'integer', 'exists:plate_categories,id'],
            'title' => [
                'required',
                'string',
                'max:255',
                Rule::unique('plate_codes', 'title')->where('plate_category_id', $this->input('plate_category_id')),
            ],
        ];
    }
}
