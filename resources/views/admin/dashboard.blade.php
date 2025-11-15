<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FleetEase Admin Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 2rem; background: #f6f8fb; color: #1f2933; }
        h1 { color: #0d3b66; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .card { background: #fff; border-radius: 0.5rem; padding: 1rem; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.1); }
        .forms { display: grid; gap: 2rem; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
        form { background: #fff; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.1); }
        label { display: block; margin-top: 1rem; font-weight: bold; }
        input, select { width: 100%; padding: 0.5rem; margin-top: 0.25rem; border: 1px solid #d1d5db; border-radius: 0.375rem; }
        button { margin-top: 1rem; padding: 0.75rem 1rem; border: none; border-radius: 0.375rem; background: #0d9488; color: #fff; font-weight: bold; cursor: pointer; }
        table { width: 100%; border-collapse: collapse; margin-top: 2rem; }
        th, td { padding: 0.75rem; border-bottom: 1px solid #e5e7eb; text-align: left; }
        .alert { background: #ecfdf5; border: 1px solid #10b981; color: #065f46; padding: 0.75rem; border-radius: 0.375rem; margin-bottom: 1rem; }
        .errors { background: #fef2f2; border: 1px solid #f87171; color: #7f1d1d; padding: 0.75rem; border-radius: 0.375rem; margin-bottom: 1rem; }
        @media (max-width: 640px) {
            body { margin: 1rem; }
        }
    </style>
</head>
<body>
    <h1>FleetEase Admin Dashboard</h1>

    @if (session('status'))
        <div class="alert">{{ session('status') }}</div>
    @endif

    @if ($errors->any())
        <div class="errors">
            <ul>
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <section class="stats">
        <div class="card">
            <h2>Total Users</h2>
            <p>{{ $userCount }}</p>
        </div>
        <div class="card">
            <h2>Total Cars</h2>
            <p>{{ $carCount }}</p>
        </div>
        <div class="card">
            <h2>Active Bookings</h2>
            <p>{{ $activeBookingCount }}</p>
        </div>
    </section>

    <section class="forms">
        <form method="POST" action="{{ route('admin.users.store') }}">
            @csrf
            <h2>Create User</h2>
            <label for="name">Name</label>
            <input id="name" name="name" type="text" value="{{ old('name') }}" required>

            <label for="username">Username</label>
            <input id="username" name="username" type="text" value="{{ old('username') }}" required>

            <label for="email">Email</label>
            <input id="email" name="email" type="email" value="{{ old('email') }}" required>

            <label for="employee_number">Employee Number</label>
            <input id="employee_number" name="employee_number" type="text" value="{{ old('employee_number') }}" required>

            <label for="password">Password</label>
            <input id="password" name="password" type="password" required>

            <label for="is_active">Status</label>
            <select id="is_active" name="is_active">
                <option value="1" @selected(old('is_active', '1') === '1')>Active</option>
                <option value="0" @selected(old('is_active') === '0')>Disabled</option>
            </select>

            <button type="submit">Add User</button>
        </form>

        <form method="POST" action="{{ route('admin.cars.store') }}">
            @csrf
            <h2>Create Car</h2>
            <label for="car_name">Name</label>
            <input id="car_name" name="name" type="text" value="{{ old('name') }}" required>

            <label for="model">Model</label>
            <input id="model" name="model" type="text" value="{{ old('model') }}" required>

            <label for="color">Color</label>
            <input id="color" name="color" type="text" value="{{ old('color') }}" required>

            <label for="number">Plate Number</label>
            <input id="number" name="number" type="text" value="{{ old('number') }}" required>

            <label for="car_is_active">Status</label>
            <select id="car_is_active" name="is_active">
                <option value="1" @selected(old('is_active', '1') === '1')>Active</option>
                <option value="0" @selected(old('is_active') === '0')>Disabled</option>
            </select>

            <button type="submit">Add Car</button>
        </form>
    </section>

    <section>
        <h2>Recent Bookings</h2>
        <table>
            <thead>
                <tr>
                    <th>User</th>
                    <th>Car</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($recentBookings as $booking)
                    <tr>
                        <td>{{ $booking->user?->name ?? 'Unknown User' }}</td>
                        <td>{{ $booking->car?->name ?? 'Unknown Car' }}</td>
                        <td>{{ optional($booking->start_date)->format('Y-m-d H:i') }}</td>
                        <td>
                            @if ($booking->end_date)
                                {{ $booking->end_date->format('Y-m-d H:i') }}
                            @else
                                Open Booking
                            @endif
                        </td>
                        <td>{{ ucfirst($booking->status->value ?? $booking->status) }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="5">No bookings recorded.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </section>
</body>
</html>
