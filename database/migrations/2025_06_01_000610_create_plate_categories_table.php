<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plate_categories', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('plate_source_id')->constrained('plate_sources')->cascadeOnDelete();
            $table->string('title');
            $table->timestamps();

            $table->unique(['plate_source_id', 'title']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plate_categories');
    }
};
