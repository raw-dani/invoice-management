<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('billing_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->foreignId('subscription_id')->constrained()->onDelete('cascade');
            $table->date('billing_date');
            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'skipped'])->default('pending');
            $table->foreignId('invoice_id')->nullable()->constrained()->nullOnDelete();
            $table->text('error_message')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->unique(['subscription_id', 'billing_date']);
            $table->index(['status', 'billing_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_schedules');
    }
};