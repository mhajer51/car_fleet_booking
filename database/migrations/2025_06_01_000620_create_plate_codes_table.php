<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plate_codes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('plate_category_id')->constrained('plate_categories')->cascadeOnDelete();
            $table->string('title');
            $table->timestamps();

            $table->unique(['plate_category_id', 'title']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plate_codes');
    }
};
