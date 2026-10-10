<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->index(['company_id', 'status'], 'invoices_company_status_idx');
            $table->index(['company_id', 'invoice_date'], 'invoices_company_invoice_date_idx');
            $table->index(['company_id', 'due_date'], 'invoices_company_due_date_idx');
            $table->index(['company_id', 'customer_id'], 'invoices_company_customer_idx');
        });

        Schema::table('quotes', function (Blueprint $table) {
            $table->index(['company_id', 'status'], 'quotes_company_status_idx');
            $table->index(['company_id', 'quote_date'], 'quotes_company_quote_date_idx');
            $table->index(['company_id', 'customer_id'], 'quotes_company_customer_idx');
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->index(['company_id', 'status'], 'subscriptions_company_status_idx');
            $table->index(['company_id', 'next_billing_date'], 'subscriptions_company_billing_date_idx');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex('invoices_company_status_idx');
            $table->dropIndex('invoices_company_invoice_date_idx');
            $table->dropIndex('invoices_company_due_date_idx');
            $table->dropIndex('invoices_company_customer_idx');
        });

        Schema::table('quotes', function (Blueprint $table) {
            $table->dropIndex('quotes_company_status_idx');
            $table->dropIndex('quotes_company_quote_date_idx');
            $table->dropIndex('quotes_company_customer_idx');
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropIndex('subscriptions_company_status_idx');
            $table->dropIndex('subscriptions_company_billing_date_idx');
        });
    }
};
