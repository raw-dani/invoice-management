<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\User;
use App\Services\DemoDataService;
use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::first();

        if (!$company) {
            $this->call(CompanyAndUserSeeder::class);
            $company = Company::first();
        }

        $service = new DemoDataService();
        $admin = User::where('company_id', $company->id)->where('role', 'owner')->first();
        $result = $service->generate($company, $admin);

        $this->command?->info("Demo data suite generated successfully for company: {$company->name}");
        if (isset($result['counts'])) {
            foreach ($result['counts'] as $type => $count) {
                $this->command?->line(" - " . ucfirst($type) . ": {$count}");
            }
        }
    }
}
