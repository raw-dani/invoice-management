<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->string('signature', 2048)->nullable()->after('logo');
            $table->string('stamp', 2048)->nullable()->after('signature');
            $table->string('qris', 2048)->nullable()->after('stamp');
            $table->string('authorized_signer_name')->nullable()->after('tax_number');
            $table->string('authorized_signer_title')->nullable()->after('authorized_signer_name');
            $table->boolean('show_signature_on_pdf')->default(true)->after('authorized_signer_title');
            $table->boolean('show_stamp_on_pdf')->default(true)->after('show_signature_on_pdf');
            $table->boolean('show_qris_on_pdf')->default(true)->after('show_stamp_on_pdf');
            $table->boolean('show_paid_watermark')->default(true)->after('show_qris_on_pdf');
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn([
                'signature',
                'stamp',
                'qris',
                'authorized_signer_name',
                'authorized_signer_title',
                'show_signature_on_pdf',
                'show_stamp_on_pdf',
                'show_qris_on_pdf',
                'show_paid_watermark',
            ]);
        });
    }
};
