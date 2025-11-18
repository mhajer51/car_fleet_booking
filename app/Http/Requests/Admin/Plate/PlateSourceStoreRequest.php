<?php

namespace App\Http\Requests\Admin\Plate;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PlateSourceStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255', Rule::unique('plate_sources', 'title')],
        ];
    }
}
