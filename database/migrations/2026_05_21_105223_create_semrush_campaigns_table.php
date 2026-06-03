<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('semrush_campaigns', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('site_id');

            $table->string('project_id')->nullable();

            // 28034237_4024841
            $table->string('campaign_id')->unique();

            $table->string('url')->nullable();

            // google, google-ai, gemini, search-gpt
            $table->string('engine')->nullable();

            $table->string('device')->nullable();

            $table->string('language')->nullable();

            $table->string('location_name')->nullable();

            $table->integer('keywords_count')->default(0);

            $table->json('raw_data')->nullable();

            $table->timestamps();

            $table->foreign('site_id')
                ->references('id')
                ->on('sites')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('semrush_campaigns');
    }
};