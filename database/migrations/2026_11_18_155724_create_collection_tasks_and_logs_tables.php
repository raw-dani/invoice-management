<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('collection_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->foreignId('invoice_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('assigned_to_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->date('due_date'); // kapan harus dihubungi
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'status', 'due_date']);
        });

        Schema::create('collection_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->foreignId('collection_task_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->foreignId('invoice_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // kolektor/staf
            $table->string('channel', 30)->default('phone'); // phone, whatsapp, email, visit
            $table->string('contact_person')->nullable();
            $table->enum('outcome', ['connected_ptp', 'connected_no_ptp', 'no_answer', 'wrong_number', 'dispute', 'other'])->default('connected_ptp');
            $table->date('promise_to_pay_date')->nullable(); // PTP Date
            $table->decimal('promise_to_pay_amount', 15, 2)->nullable();
            $table->text('notes');
            $table->timestamps();

            $table->index(['company_id', 'customer_id']);
            $table->index(['promise_to_pay_date']);
        });

        // WhatsApp Gateway Configuration in settings or companies
        Schema::table('companies', function (Blueprint $table) {
            $table->string('whatsapp_provider', 30)->default('manual')->after('invoice_approval_threshold'); // manual, fonnte, wablas, meta
            $table->string('whatsapp_api_token', 255)->nullable()->after('whatsapp_provider');
            $table->string('whatsapp_api_url', 255)->nullable()->after('whatsapp_api_token');
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['whatsapp_provider', 'whatsapp_api_token', 'whatsapp_api_url']);
        });

        Schema::dropIfExists('collection_logs');
        Schema::dropIfExists('collection_tasks');
    }
};
