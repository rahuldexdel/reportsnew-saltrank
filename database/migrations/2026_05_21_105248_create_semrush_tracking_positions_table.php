<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('semrush_tracking_positions', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('site_id');

            $table->unsignedBigInteger('semrush_campaign_id');

            // Pi
            $table->string('prompt_id')->nullable();

            // Ph
            $table->text('keyword')->nullable();

            // 2026-05-20
            $table->date('tracking_date')->nullable();

            // ranking position
            $table->string('position')->nullable();

            // visibility
            $table->decimal('visibility', 12, 2)->default(0);

            // share of voice
            $table->decimal('sov', 12, 2)->default(0);

            // traffic
            $table->integer('traffic')->default(0);

            // traffic cost
            $table->integer('traffic_cost')->default(0);

            // serp features
            $table->json('serp_features')->nullable();

            // complete api row
            $table->json('raw_data')->nullable();

            $table->timestamps();

            $table->foreign('site_id')
                ->references('id')
                ->on('sites')
                ->onDelete('cascade');

            $table->foreign('semrush_campaign_id')
                ->references('id')
                ->on('semrush_campaigns')
                ->onDelete('cascade');
        $table->unique(
            ['semrush_campaign_id', 'prompt_id'],
            'semrush_tracking_unique'
        );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('semrush_tracking_positions');
    }
};