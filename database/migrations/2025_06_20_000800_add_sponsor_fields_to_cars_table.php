<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->boolean('is_company_owned')->default(true)->after('notes');
            $table->foreignId('sponsor_id')->nullable()->after('is_company_owned')->constrained('sponsors')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->dropConstrainedForeignId('sponsor_id');
            $table->dropColumn('is_company_owned');
        });
    }
};
