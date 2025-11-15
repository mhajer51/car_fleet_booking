<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ config('app.name', 'Laravel Fleet') }}</title>
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
                <link rel="stylesheet" href="{{ asset('build/' . $cssPath) }}">
            @endforeach
        @else
            <style>
                body {
                    margin: 0;
                    min-height: 100vh;
                    font-family: 'Instrument Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    background: #020617;
                    color: rgba(255, 255, 255, 0.92);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .build-warning {
                    max-width: 32rem;
                    padding: 2rem;
                    border-radius: 1.5rem;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    background: rgba(15, 23, 42, 0.85);
                    box-shadow: 0 20px 50px rgba(2, 6, 23, 0.75);
                    text-align: center;
                }

                .build-warning h1 {
                    font-size: 1.5rem;
                    margin-bottom: 0.75rem;
                }

                .build-warning code {
                    font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                    padding: 0.35rem 0.65rem;
                    border-radius: 999px;
                    background: rgba(71, 85, 105, 0.35);
                    font-size: 0.85rem;
                }
            </style>
        @endif
    </head>
    <body>
        <div id="app">
            @unless ($useHotServer || $entry)
                <div class="build-warning">
                    <h1>الأصول غير مجهزة بعد</h1>
                    <p>شغّل الأمر التالي أولاً ثم أعد تحميل الصفحة:</p>
                    <p><code>npm run build</code></p>
                    <p>بعدها شغّل الخادم: <code>php artisan serve --host=0.0.0.0 --port=8000</code></p>
                </div>
            @endunless
        </div>
        @if (!$useHotServer && $entry)
            <script type="module" src="{{ asset('build/' . $entry['file']) }}" defer></script>
        @endif
    </body>
</html>
