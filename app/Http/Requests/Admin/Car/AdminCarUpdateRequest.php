<?php

namespace App\Http\Requests\Admin\Car;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class AdminCarUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $carId = $this->route('car')?->id;

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'model' => ['sometimes', 'string', 'max:255'],
            'color' => ['sometimes', 'string', 'max:255'],
            'number' => ['sometimes', 'string', 'max:255', Rule::unique('cars', 'number')->ignore($carId)],
            'plate_source_id' => ['sometimes', 'integer', 'exists:plate_sources,id'],
            'plate_category_id' => [
                'sometimes',
                'integer',
                Rule::exists('plate_categories', 'id')->where(
                    fn ($query) => $query->where('plate_source_id', $this->input('plate_source_id', $this->route('car')?->plate_source_id))
                ),
            ],
            'plate_code_id' => [
                'sometimes',
                'integer',
                Rule::exists('plate_codes', 'id')->where(
                    fn ($query) => $query->where('plate_category_id', $this->input('plate_category_id', $this->route('car')?->plate_category_id))
                ),
            ],
            'emirate' => [
                'sometimes',
                'string',
                Rule::in([
                    'dubai',
                    'abu_dhabi',
                    'sharjah',
                    'ajman',
                    'umm_al_quwain',
                    'ras_al_khaimah',
                    'fujairah',
                ]),
            ],
            'notes' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.string' => 'Vehicle name must be a valid string.',
            'model.string' => 'Vehicle model must be a valid string.',
            'color.string' => 'Vehicle color must be a valid string.',
            'number.unique' => 'This plate number is already registered.',
            'emirate.in' => 'Choose a valid emirate.',
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        $errors = $validator->errors();
        throw new HttpResponseException(
            apiResponse('Validation failed', $errors->toArray(), 422)
        );
    }
}
