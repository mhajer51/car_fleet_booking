<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ViolationSearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'plateNumber' => $this->normalize($this->input('plateNumber')),
            'plateSource' => $this->normalize($this->input('plateSource')),
            'plateCategory' => $this->normalize($this->input('plateCategory')),
            'plateCode' => $this->normalize($this->input('plateCode')),
            'language' => $this->normalize($this->input('language', 'en')),
        ]);
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

    protected function normalize($value): ?string
    {
        if ($value === null) {
            return null;
        }

        if (is_string($value)) {
            return trim($value);
        }

        if (is_numeric($value)) {
            return (string) $value;
        }

        return $value;
    }
}
