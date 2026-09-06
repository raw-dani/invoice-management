<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement('ALTER TABLE invoices MODIFY COLUMN discount_type TINYINT UNSIGNED NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE quotes   MODIFY COLUMN discount_type TINYINT UNSIGNED NOT NULL DEFAULT 0');
    }

    public function down(): void
    {
        // No revert needed
    }
};
