<?php

namespace App\Http\Requests\Admin\Booking;

use App\Enums\BookingStatus;
use Illuminate\Foundation\Http\FormRequest;
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
            'status' => ['sometimes', 'string', Rule::in(BookingStatus::values())],
            'from_date' => ['sometimes', 'date'],
            'to_date' => ['sometimes', 'date', 'after_or_equal:from_date'],
        ];
    }
}
