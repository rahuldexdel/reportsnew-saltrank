<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('competitors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->string('domain')->index();
            $table->decimal('relevance', 5, 2)->nullable();
            $table->integer('common_keywords')->nullable();
            $table->integer('organic_keywords')->nullable();
            $table->integer('organic_traffic')->nullable();
            $table->decimal('organic_cost', 10, 2)->nullable();
            $table->timestamps();

            $table->unique(['site_id', 'domain']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('competitors');
    }
};
