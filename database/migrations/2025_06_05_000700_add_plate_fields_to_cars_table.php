<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->foreignId('plate_source_id')->nullable()->after('number')->constrained('plate_sources')->restrictOnDelete();
            $table->foreignId('plate_category_id')->nullable()->after('plate_source_id')->constrained('plate_categories')->restrictOnDelete();
            $table->foreignId('plate_code_id')->nullable()->after('plate_category_id')->constrained('plate_codes')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->dropConstrainedForeignId('plate_code_id');
            $table->dropConstrainedForeignId('plate_category_id');
            $table->dropConstrainedForeignId('plate_source_id');
        });
    }
};
