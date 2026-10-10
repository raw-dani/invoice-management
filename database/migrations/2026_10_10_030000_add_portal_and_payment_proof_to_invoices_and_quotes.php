<?php

use App\Models\Invoice;
use App\Models\Quote;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('public_token', 64)->nullable()->unique()->after('invoice_number');
            $table->string('payment_proof_path', 500)->nullable()->after('terms');
            $table->enum('payment_proof_status', ['none', 'pending', 'approved', 'rejected'])->default('none')->after('payment_proof_path');
            $table->text('payment_proof_notes')->nullable()->after('payment_proof_status');
            $table->timestamp('payment_proof_uploaded_at')->nullable()->after('payment_proof_notes');
        });

        Schema::table('quotes', function (Blueprint $table) {
            $table->string('public_token', 64)->nullable()->unique()->after('quote_number');
        });

        // Generate public_token for existing invoices
        Invoice::whereNull('public_token')->chunkById(100, function ($invoices) {
            foreach ($invoices as $invoice) {
                $invoice->update(['public_token' => Str::random(32)]);
            }
        });

        // Generate public_token for existing quotes
        Quote::whereNull('public_token')->chunkById(100, function ($quotes) {
            foreach ($quotes as $quote) {
                $quote->update(['public_token' => Str::random(32)]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            $table->dropColumn('public_token');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn([
                'public_token',
                'payment_proof_path',
                'payment_proof_status',
                'payment_proof_notes',
                'payment_proof_uploaded_at',
            ]);
        });
    }
};
