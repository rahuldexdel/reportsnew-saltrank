<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('organic_keywords', function (Blueprint $table) {
            $table->id();

            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->foreignId('competitor_id')->nullable()->constrained()->nullOnDelete();

            $table->string('keyword')->index();
            $table->integer('position')->nullable();
            $table->integer('previous_position')->nullable();
            
            $table->integer('search_volume')->nullable();
            $table->decimal('cpc', 8, 2)->nullable();
            $table->string('url')->nullable();

            $table->date('fetched_at')->index();
            $table->timestamps();

            $table->index(['site_id', 'competitor_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organic_keywords');
    }
};
