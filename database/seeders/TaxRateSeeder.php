<?php

namespace Database\Seeders;

use App\Models\TaxRate;
use Illuminate\Database\Seeder;

class TaxRateSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['name' => 'PPN 11%', 'rate' => 11],
            ['name' => 'PPN 12%', 'rate' => 12],
            ['name' => 'No Tax', 'rate' => 0],
            ['name' => 'Custom', 'rate' => 0],
        ] as $index => $tax) {
            TaxRate::updateOrCreate(
                ['company_id' => null, 'name' => $tax['name']],
                [...$tax, 'is_default' => $index === 0, 'is_active' => true]
            );
        }
    }
}