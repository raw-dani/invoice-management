<?php

namespace Tests\Unit;

use App\Services\TaxCalculator;
use PHPUnit\Framework\TestCase;

class TaxCalculatorTest extends TestCase
{
    private TaxCalculator $calculator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->calculator = new TaxCalculator();
    }

    public function test_line_total_applies_discount_before_tax(): void
    {
        $result = $this->calculator->lineTotal(2, 100, 20, 11);

        $this->assertSame(180.0, $result['before_tax']);
        $this->assertSame(19.8, $result['tax_amount']);
        $this->assertSame(199.8, $result['total']);
    }

    public function test_line_total_does_not_return_negative_taxable_amount(): void
    {
        $result = $this->calculator->lineTotal(1, 100, 150, 11);

        $this->assertSame(0.0, $result['before_tax']);
        $this->assertSame(0.0, $result['tax_amount']);
        $this->assertSame(0.0, $result['total']);
    }

    public function test_tax_amount_rounds_to_two_decimals(): void
    {
        $this->assertSame(12.35, $this->calculator->taxAmount(112.27, 11));
        $this->assertSame(0.0, $this->calculator->taxAmount(100, 0));
    }
}