<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('approval_status', 30)->default('not_required')->after('status'); // not_required, pending, approved, rejected
            $table->foreignId('approved_by_user_id')->nullable()->after('approval_status')->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable()->after('approved_by_user_id');
            $table->text('rejection_reason')->nullable()->after('approved_at');
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->boolean('enable_invoice_approval')->default(false)->after('show_paid_watermark');
            $table->decimal('invoice_approval_threshold', 15, 2)->default(10000000)->after('enable_invoice_approval'); // threshold e.g. Rp 10.000.000
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['enable_invoice_approval', 'invoice_approval_threshold']);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['approved_by_user_id']);
            $table->dropColumn(['approval_status', 'approved_by_user_id', 'approved_at', 'rejection_reason']);
        });
    }
};
