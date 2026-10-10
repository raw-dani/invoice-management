<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Services\DemoDataService;
use Illuminate\Console\Command;

class ClearDemoData extends Command
{
    protected $signature = 'demo:clear {--company= : ID of the company to clear demo data for}';
    protected $description = 'Delete all demo data (is_demo = true) for a company';

    public function handle(DemoDataService $service): int
    {
        $companyId = $this->option('company');
        $company = $companyId ? Company::find($companyId) : Company::first();

        if (!$company) {
            $this->error('No company found.');
            return self::FAILURE;
        }

        $this->warn("Clearing all demo data for company: {$company->name} (ID: {$company->id})...");

        $deleted = $service->clear($company);

        $this->info('Demo data cleared successfully:');
        foreach ($deleted as $key => $count) {
            $this->line("  • Deleted " . ucfirst($key) . ": {$count}");
        }

        return self::SUCCESS;
    }
}
