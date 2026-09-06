<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->string('sku')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('type', ['one_time', 'subscription'])->default('one_time');
            $table->decimal('price', 15, 2)->default(0);
            $table->string('currency', 3)->default('IDR');
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->enum('billing_cycle', ['monthly', 'quarterly', 'semi_annual', 'yearly'])->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
