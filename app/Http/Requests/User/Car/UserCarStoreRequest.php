<?php

namespace App\Http\Requests\User\Car;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class UserCarStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'model' => ['required', 'string', 'max:255'],
            'color' => ['required', 'string', 'max:255'],
            'number' => ['required', 'string', 'max:255', 'unique:cars,number'],
            'plate_source_id' => ['required', 'integer', 'exists:plate_sources,id'],
            'plate_category_id' => [
                'required',
                'integer',
                Rule::exists('plate_categories', 'id')->where(
                    fn ($query) => $query->where('plate_source_id', $this->input('plate_source_id'))
                ),
            ],
            'plate_code_id' => [
                'required',
                'integer',
                Rule::exists('plate_codes', 'id')->where(
                    fn ($query) => $query->where('plate_category_id', $this->input('plate_category_id'))
                ),
            ],
            'emirate' => [
                'required',
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
            'name.required' => 'Vehicle name is required.',
            'model.required' => 'Vehicle model is required.',
            'color.required' => 'Vehicle color is required.',
            'number.required' => 'Plate number is required.',
            'number.unique' => 'This plate number is already registered.',
            'emirate.required' => 'Select the vehicle emirate.',
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
