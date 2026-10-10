<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $tables = [
        'users',
        'customers',
        'products',
        'quotes',
        'invoices',
        'payments',
        'subscriptions',
        'activity_logs',
        'notifications',
    ];

    public function up(): void
    {
        foreach ($this->tables as $tableName) {
            if (Schema::hasTable($tableName) && !Schema::hasColumn($tableName, 'is_demo')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->boolean('is_demo')->default(false)->index();
                });
            }
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $tableName) {
            if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'is_demo')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropColumn('is_demo');
                });
            }
        }
    }
};
