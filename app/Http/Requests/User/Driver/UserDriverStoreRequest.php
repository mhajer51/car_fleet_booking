<?php

namespace App\Http\Requests\User\Driver;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class UserDriverStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'license_number' => ['required', 'string', 'max:255', 'unique:drivers,license_number'],
            'phone_number' => ['required', 'string', 'max:255', 'unique:drivers,phone_number'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Driver name is required.',
            'license_number.required' => 'License number is required.',
            'license_number.unique' => 'This license number is already assigned.',
            'phone_number.required' => 'Phone number is required.',
            'phone_number.unique' => 'This phone number is already in use.',
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
