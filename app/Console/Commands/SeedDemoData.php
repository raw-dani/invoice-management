<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Models\User;
use App\Services\DemoDataService;
use Illuminate\Console\Command;

class SeedDemoData extends Command
{
    protected $signature = 'demo:seed {--company= : ID of the company to seed demo data for}';
    protected $description = 'Seed complete realistic demo data for a company';

    public function handle(DemoDataService $service): int
    {
        $companyId = $this->option('company');
        $company = $companyId ? Company::find($companyId) : Company::first();

        if (!$company) {
            $this->error('No company found to seed demo data.');
            return self::FAILURE;
        }

        $this->info("Generating demo data for company: {$company->name} (ID: {$company->id})...");

        $admin = User::where('company_id', $company->id)->whereIn('role', ['owner', 'admin'])->first();
        $stats = $service->generate($company, $admin);

        $this->info('Demo data generated successfully:');
        foreach ($stats['counts'] as $key => $count) {
            $this->line("  • " . ucfirst($key) . ": {$count}");
        }

        return self::SUCCESS;
    }
}
