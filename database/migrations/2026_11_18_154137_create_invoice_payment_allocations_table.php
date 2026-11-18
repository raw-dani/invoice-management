<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Make invoice_id nullable on payments table so a single payment can span multiple invoices or be stored as customer credit
        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('invoice_id')->nullable()->change();
            $table->decimal('allocated_amount', 15, 2)->default(0)->after('amount');
            $table->decimal('unallocated_amount', 15, 2)->default(0)->after('allocated_amount');
            $table->boolean('is_multi_allocation')->default(false)->after('unallocated_amount');
        });

        Schema::create('invoice_payment_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained()->onDelete('cascade');
            $table->foreignId('invoice_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 15, 2);
            $table->date('allocated_at');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['payment_id', 'invoice_id']);
            $table->index(['invoice_id', 'allocated_at']);
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->decimal('credit_balance', 15, 2)->default(0)->after('credit_limit');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['credit_balance']);
        });

        Schema::dropIfExists('invoice_payment_allocations');

        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['allocated_amount', 'unallocated_amount', 'is_multi_allocation']);
        });
    }
};
