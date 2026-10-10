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
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('milestone_name')->nullable()->after('quote_id');
            $table->unsignedInteger('milestone_sequence')->nullable()->after('milestone_name');
            $table->unsignedInteger('milestone_total_termins')->nullable()->after('milestone_sequence');
            $table->decimal('milestone_percentage', 5, 2)->nullable()->after('milestone_total_termins');
        });

        Schema::create('quote_milestones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('quote_id')->constrained()->cascadeOnDelete();
            $table->foreignId('invoice_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('sequence')->default(1);
            $table->string('name');
            $table->decimal('percentage', 5, 2);
            $table->decimal('amount', 15, 2);
            $table->date('due_date')->nullable();
            $table->string('status', 30)->default('pending'); // pending, invoiced, paid
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['quote_id', 'sequence']);
            $table->index(['company_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quote_milestones');

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn([
                'milestone_name',
                'milestone_sequence',
                'milestone_total_termins',
                'milestone_percentage',
            ]);
        });
    }
};
