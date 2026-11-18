<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            if (!Schema::hasColumn('invoices', 'invoice_type')) {
                $table->string('invoice_type', 30)->default('standard')->after('invoice_number');
            }
            if (!Schema::hasColumn('invoices', 'parent_invoice_id')) {
                $table->foreignId('parent_invoice_id')->nullable()->after('invoice_type')->constrained('invoices')->onDelete('set null');
            }
            if (!Schema::hasColumn('invoices', 'withholding_tax_type')) {
                $table->string('withholding_tax_type', 50)->nullable()->after('tax_amount');
            }
            if (!Schema::hasColumn('invoices', 'withholding_tax_rate')) {
                $table->decimal('withholding_tax_rate', 5, 2)->default(0)->after('withholding_tax_type');
            }
            if (!Schema::hasColumn('invoices', 'withholding_tax_amount')) {
                $table->decimal('withholding_tax_amount', 15, 2)->default(0)->after('withholding_tax_rate');
            }
            if (!Schema::hasColumn('invoices', 'withholding_tax_slip_number')) {
                $table->string('withholding_tax_slip_number', 100)->nullable()->after('withholding_tax_amount');
            }
            if (!Schema::hasColumn('invoices', 'withholding_tax_slip_date')) {
                $table->date('withholding_tax_slip_date')->nullable()->after('withholding_tax_slip_number');
            }
            if (!Schema::hasColumn('invoices', 'withholding_tax_slip_file')) {
                $table->string('withholding_tax_slip_file', 255)->nullable()->after('withholding_tax_slip_date');
            }
            if (!Schema::hasColumn('invoices', 'tax_invoice_number')) {
                $table->string('tax_invoice_number', 100)->nullable()->after('withholding_tax_slip_file');
            }
        });

        Schema::table('customers', function (Blueprint $table) {
            if (!Schema::hasColumn('customers', 'credit_limit')) {
                $table->decimal('credit_limit', 15, 2)->default(0)->after('tax_number');
            }
            if (!Schema::hasColumn('customers', 'payment_terms_days')) {
                $table->integer('payment_terms_days')->default(30)->after('credit_limit');
            }
            if (!Schema::hasColumn('customers', 'npwp_16')) {
                $table->string('npwp_16', 30)->nullable()->after('tax_number');
            }
            if (!Schema::hasColumn('customers', 'nik')) {
                $table->string('nik', 30)->nullable()->after('npwp_16');
            }
            if (!Schema::hasColumn('customers', 'is_pkp')) {
                $table->boolean('is_pkp')->default(false)->after('nik');
            }
        });

        Schema::table('companies', function (Blueprint $table) {
            if (!Schema::hasColumn('companies', 'npwp_16')) {
                $table->string('npwp_16', 30)->nullable()->after('tax_number');
            }
            if (!Schema::hasColumn('companies', 'nitku')) {
                $table->string('nitku', 30)->nullable()->after('npwp_16');
            }
            if (!Schema::hasColumn('companies', 'is_pkp')) {
                $table->boolean('is_pkp')->default(true)->after('nitku');
            }
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['npwp_16', 'nitku', 'is_pkp']);
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['credit_limit', 'payment_terms_days', 'npwp_16', 'nik', 'is_pkp']);
        });

        Schema::table('invoices', function (Blueprint $table) {
            if (Schema::hasColumn('invoices', 'parent_invoice_id')) {
                $table->dropForeign(['parent_invoice_id']);
            }
            $table->dropColumn([
                'invoice_type',
                'parent_invoice_id',
                'withholding_tax_type',
                'withholding_tax_rate',
                'withholding_tax_amount',
                'withholding_tax_slip_number',
                'withholding_tax_slip_date',
                'withholding_tax_slip_file',
                'tax_invoice_number'
            ]);
        });
    }
};
