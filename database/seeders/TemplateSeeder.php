<?php

namespace Database\Seeders;

use App\Models\InvoiceTemplate;
use App\Models\QuoteTemplate;
use Illuminate\Database\Seeder;

class TemplateSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['slug' => 'modern', 'name' => 'Modern'],
            ['slug' => 'professional', 'name' => 'Professional'],
            ['slug' => 'classic', 'name' => 'Classic'],
            ['slug' => 'compact', 'name' => 'Compact'],
        ] as $index => $template) {
            InvoiceTemplate::updateOrCreate(
                ['company_id' => null, 'slug' => $template['slug']],
                [...$template, 'is_active' => $index === 0, 'is_default' => $index === 0]
            );
        }

        foreach ([
            ['slug' => 'modern', 'name' => 'Modern'],
            ['slug' => 'professional', 'name' => 'Professional'],
            ['slug' => 'corporate', 'name' => 'Corporate'],
        ] as $index => $template) {
            QuoteTemplate::updateOrCreate(
                ['company_id' => null, 'slug' => $template['slug']],
                [...$template, 'is_active' => $index === 0, 'is_default' => $index === 0]
            );
        }
    }
}