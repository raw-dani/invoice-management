<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes (SPA Fallback)
|--------------------------------------------------------------------------
|
| Laravel serves as JSON API at /api/* and renders the React SPA shell
| for all other routes (handled by client-side routing).
|
*/

// Sanctum CSRF cookie endpoint (for SPA authentication)
Route::get('/sanctum/csrf-cookie', [\Laravel\Sanctum\Http\Controllers\CsrfCookieController::class, 'show']);

// Health check (also exposed via /api/health)
Route::get('/health', fn () => response()->json(['status' => 'ok']));

// SPA fallback — React Router handles all client-side routes
Route::fallback(function () {
    return view('app');
});
