<?php

namespace App\Http\Requests\Admin\Booking;

use App\Enums\BookingStatus;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class AdminBookingFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['sometimes', 'integer', 'exists:users,id'],
            'car_id' => ['sometimes', 'integer', 'exists:cars,id'],
            'driver_id' => ['sometimes', 'integer', 'exists:drivers,id'],
            'status' => ['sometimes', 'string', Rule::in(BookingStatus::values())],
            'is_approved' => ['sometimes', 'boolean'],
            'from_date' => ['sometimes', 'date'],
            'to_date' => ['sometimes', 'date', 'after_or_equal:from_date'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (!$this->has('is_approved')) {
            return;
        }

        $value = $this->input('is_approved');

        if ($value === null || $value === '') {
            $this->request->remove('is_approved');
            return;
        }

        if (is_bool($value)) {
            return;
        }

        if (is_string($value)) {
            $normalized = strtolower($value);

            if (in_array($normalized, ['approved', 'true', '1', 'yes'], true)) {
                $this->merge(['is_approved' => true]);
                return;
            }

            if (in_array($normalized, ['pending', 'false', '0', 'no'], true)) {
                $this->merge(['is_approved' => false]);
                return;
            }
        }

        if (is_numeric($value)) {
            $this->merge(['is_approved' => (bool) (int) $value]);
        }
    }


    protected function failedValidation(Validator $validator)
    {
        $errors = $validator->errors();
        throw new HttpResponseException(
            apiResponse('Validation failed', $errors->toArray(), 422)
        );
    }
}
