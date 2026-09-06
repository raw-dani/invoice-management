<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(EmailTemplateSeeder::class);
        $this->call(TemplateSeeder::class);
        $this->call(CurrencySeeder::class);
        $this->call(TaxRateSeeder::class);
    }
}
