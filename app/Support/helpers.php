<?php

use App\Models\Currency;

if (!function_exists('format_money')) {
    function format_money(float|int|string $amount, string $currency = 'IDR'): string
    {
        $currency = strtoupper($currency);
        try {
            $record = Currency::where('code', $currency)->where('is_active', true)->first();
        } catch (\Throwable) {
            $record = null;
        }
        $decimals = $record?->decimal_places ?? ($currency === 'IDR' ? 0 : 2);
        $symbol = $record?->symbol ?? $currency;

        return $symbol . ' ' . number_format((float) $amount, $decimals, ',', '.');
    }
}