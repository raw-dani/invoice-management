<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Company;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class CompanyAndUserSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default company
        $company = Company::create([
            'name' => 'My Company',
            'address' => 'Jl. Contoh No. 123',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'country' => 'Indonesia',
            'phone' => '021-1234567',
            'email' => 'info@mycompany.com',
            'website' => 'www.mycompany.com',
            'tax_number' => '01.234.567.8-901.234',
        ]);

        // Create default admin user
        User::create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'company_id' => $company->id,
            'role' => 'owner',
        ]);
    }
}
