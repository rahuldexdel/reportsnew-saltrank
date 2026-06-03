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
            Schema::create('ai_summaries', function (Blueprint $table) {
                $table->id();

                $table->unsignedBigInteger('client_id');
                $table->unsignedBigInteger('group_id')->nullable();

                $table->string('tab', 50);      // overview, google_ads, seo
                $table->string('range', 30);    // last_month, this_month
                $table->string('month', 7);     // 2025-01

                $table->longText('summary_text');
                $table->timestamps();

                $table->index([
                    'client_id',
                    'group_id',
                    'tab',
                    'range',
                    'month'
                ]);
            });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_summaries');
    }
};
