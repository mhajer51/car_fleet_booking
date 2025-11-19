<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Http\Middleware\JwtAuthenticate;
use App\Mail\BookingRequestSubmitted;
use App\Mail\BookingRequestUpdated;
use App\Models\Admin;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Driver;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class BookingApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_booking_via_api(): void
    {
        Mail::fake();
        $this->withoutMiddleware(JwtAuthenticate::class);

        $admin = Admin::factory()->create(['is_active' => true]);
        $user = User::factory()->create();
        $car = Car::factory()->create();
        $driver = Driver::factory()->create();

        $payload = [
            'user_id' => $user->id,
            'car_id' => $car->id,
            'driver_id' => $driver->id,
            'price' => '150.75',
            'start_date' => '2024-05-01 09:00:00',
            'end_date' => '2024-05-01 10:00:00',
            'note' => 'Need airport transfer.',
        ];

        $response = $this->postJson('/api/user/bookings', $payload);

        $response->assertOk()
            ->assertJsonFragment(['message' => 'Car booked successfully.']);

        $this->assertDatabaseHas('bookings', [
            'user_id' => $user->id,
            'car_id' => $car->id,
            'is_approved' => false,
        ]);

        Mail::assertSent(BookingRequestSubmitted::class, function (BookingRequestSubmitted $mail) use ($admin, $user) {
            return $mail->hasTo($admin->email) && $mail->booking->user_id === $user->id;
        });
    }

    public function test_user_updates_booking_via_api_and_notifies_admins(): void
    {
        Mail::fake();
        $this->withoutMiddleware(JwtAuthenticate::class);

        $admin = Admin::factory()->create(['is_active' => true]);
        $booking = Booking::factory()->pending()->create();
        $car = Car::factory()->create();
        $driver = Driver::factory()->create();

        $payload = [
            'user_id' => $booking->user_id,
            'car_id' => $car->id,
            'driver_id' => $driver->id,
            'price' => '220.50',
            'start_date' => '2024-06-01 09:30:00',
            'end_date' => '2024-06-01 11:00:00',
            'note' => 'Updated itinerary.',
        ];

        $response = $this->putJson("/api/user/bookings/{$booking->id}", $payload);

        $response->assertOk()
            ->assertJsonFragment(['message' => 'Booking updated successfully.']);

        Mail::assertSent(BookingRequestUpdated::class, function (BookingRequestUpdated $mail) use ($admin, $booking) {
            return $mail->hasTo($admin->email) && $mail->booking->id === $booking->id;
        });
    }

    public function test_return_endpoint_closes_booking(): void
    {
        $booking = Booking::factory()->open()->create();

        Carbon::setTestNow('2024-05-02 12:00:00');

        $response = $this->postJson("/api/bookings/{$booking->id}/return");

        $response->assertOk()
            ->assertJsonFragment(['message' => 'Booking closed successfully.']);

        $booking->refresh();
        $this->assertEquals(BookingStatus::COMPLETED, $booking->status);
        $this->assertNotNull($booking->end_date);

        Carbon::setTestNow();
    }
}
