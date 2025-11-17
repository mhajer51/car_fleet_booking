<?php

namespace App\Http\Requests\Admin\Car;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class AdminCarStoreRequest extends FormRequest
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
