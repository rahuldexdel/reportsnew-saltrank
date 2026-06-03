<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaign_daily_stats', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('organization_id');
            $table->unsignedBigInteger('account_id')->nullable();
            $table->unsignedBigInteger('campaign_id');
            $table->unsignedBigInteger('ad_id');
            $table->date('stat_date');
            $table->string('campaign_name')->nullable();
            $table->string('ad_name')->nullable();
            $table->integer('impressions')->default(0);
            $table->integer('clicks')->default(0);
            $table->decimal('ctr', 8, 2)->default(0);
            $table->decimal('total_spend', 12, 4)->default(0);
            $table->string('primary_creative_url')->nullable();
            $table->string('target_url')->nullable();
            $table->json('geofence')->nullable();
            $table->timestamps();

            $table->unique(['organization_id', 'campaign_id', 'ad_id', 'stat_date'], 'unique_daily_stat');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaign_daily_stats');
    }
};
