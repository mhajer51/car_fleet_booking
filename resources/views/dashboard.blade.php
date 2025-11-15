<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>
            @if (($page ?? 'portal') === 'admin')
                لوحة تحكم المشرف | {{ config('app.name', 'Car Fleet Booking') }}
            @else
                بوابة العملاء | {{ config('app.name', 'Car Fleet Booking') }}
            @endif
        </title>
        <link rel="preconnect" href="https://fonts.bunny.net" />
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
        @php
            $useHotServer = app()->environment('local') && file_exists(public_path('hot'));
            $manifestPath = public_path('build/manifest.json');
            $manifest = file_exists($manifestPath) ? json_decode(file_get_contents($manifestPath), true) : null;
            $entry = $manifest['resources/js/app.js'] ?? null;
        @endphp
        @if ($useHotServer)
            @vite(['resources/css/app.css', 'resources/js/app.js'])
        @elseif ($entry)
            @foreach (($entry['css'] ?? []) as $cssPath)
                <link rel="stylesheet" href="{{ asset('build/' . $cssPath) }}" />
            @endforeach
        @else
            <style>
                body {
                    margin: 0;
                    min-height: 100vh;
                    display: grid;
                    place-items: center;
                    font-family: 'Instrument Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    background: radial-gradient(circle at top, #0f172a, #020617);
                    color: #f8fafc;
                }

                .build-warning {
                    padding: 2.5rem;
                    border-radius: 1.75rem;
                    background: rgba(15, 23, 42, 0.8);
                    border: 1px solid rgba(248, 250, 252, 0.2);
                    text-align: center;
                    max-width: 30rem;
                }
            </style>
        @endif
    </head>
    <body>
        <div id="app" data-page="{{ $page ?? 'portal' }}" data-mode="{{ $mode ?? 'dashboard' }}">
            @unless ($useHotServer || $entry)
                <div class="build-warning">
                    <h1>الواجهة غير جاهزة بعد</h1>
                    <p>نفّذ الأمر <code>npm run build</code> ثم أعد تحميل الصفحة لتظهر لوحة التحكم.</p>
                </div>
            @endunless
        </div>
        @if (!$useHotServer && $entry)
            <script type="module" src="{{ asset('build/' . $entry['file']) }}" defer></script>
        @endif
    </body>
</html>
