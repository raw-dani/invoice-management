<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name', 'Invoice Management') }}</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.ico">

    {{-- React build assets (production) --}}
    @viteReactRefresh
    @vite(['resources/js/app.tsx', 'resources/css/app.css'])
</head>
<body class="font-sans antialiased">
    <div id="root"></div>
</body>
</html>
