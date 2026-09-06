<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class MoneyFormattingTest extends TestCase
{
    public function test_helper_falls_back_to_currency_code_without_database(): void
    {
        $this->assertSame('USD 1.234,50', format_money(1234.5, 'USD'));
    }
}