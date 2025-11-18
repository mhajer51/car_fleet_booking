<?php

namespace App\Http\Requests\Admin\Sponsor;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class AdminSponsorUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'traffic_file_number' => [
                'required',
                'string',
                'max:255',
                Rule::unique('sponsors', 'traffic_file_number')->ignore($this->sponsor->id ?? null),
            ],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Sponsor title is required.',
            'traffic_file_number.required' => 'Traffic file number is required.',
            'traffic_file_number.unique' => 'This traffic file number is already registered.',
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
