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
        Schema::create('google_ads_campaign_device_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ads_account_id')->index();
            $table->string('campaign_id')->index();
            $table->string('device');

            $table->bigInteger('impressions')->default(0);
            $table->bigInteger('clicks')->default(0);

            $table->date('date');
            $table->timestamps();

           $table->unique(
                ['ads_account_id','campaign_id','device','date'],
                'gacdm_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('google_ads_campaign_device_metrics');
    }
};
