<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->string('subscription_number')->unique();
            $table->enum('status', ['draft', 'active', 'paused', 'cancelled', 'expired'])->default('active');
            $table->enum('billing_cycle', ['monthly', 'quarterly', 'semi_annual', 'yearly']);
            $table->date('start_date');
            $table->date('next_billing_date');
            $table->date('end_date')->nullable();
            $table->unsignedSmallInteger('invoice_due_days')->default(30);
            $table->string('currency', 3)->default('IDR');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['status', 'next_billing_date']);
            $table->index(['company_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};