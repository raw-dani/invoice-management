<?php

namespace App\Services;

class TaxCalculator
{
    public function lineTotal(float $quantity, float $unitPrice, float $discount, float $taxRate): array
    {
        $beforeTax = max(0, ($quantity * $unitPrice) - $discount);
        $tax = round($beforeTax * ($taxRate / 100), 2);

        return [
            'before_tax' => round($beforeTax, 2),
            'tax_amount' => $tax,
            'total' => round($beforeTax + $tax, 2),
        ];
    }

    public function taxAmount(float $amount, float $taxRate): float
    {
        return round($amount * ($taxRate / 100), 2);
    }
}