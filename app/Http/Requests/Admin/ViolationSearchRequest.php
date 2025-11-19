<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ViolationSearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'plateNumber' => ['required', 'string', 'max:255'],
            'plateSource' => ['required', 'string', 'max:255'],
            'plateCategory' => ['required', 'string', 'max:255'],
            'plateCode' => ['required', 'string', 'max:255'],
            'language' => ['sometimes', 'string', 'in:en,ar'],
        ];
    }
}
