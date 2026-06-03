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
        Schema::create('google_ads_ads', function (Blueprint $table) {
            $table->id();

            $table->foreignId('ads_account_id')->index();
            $table->string('campaign_id')->index();

            $table->string('ad_id');
            $table->date('date');

            $table->string('type');
            $table->boolean('is_retargeting')->default(false);

            // 🔥 ADD THESE (YOU ARE USING THEM)
            $table->string('campaign_name')->nullable();
            $table->string('ad_group_name')->nullable();

            $table->text('headline')->nullable();
            $table->text('description')->nullable();
            $table->text('ad_preview')->nullable();

            $table->text('image_url')->nullable();
            $table->text('final_url')->nullable();

            $table->bigInteger('impressions')->default(0);
            $table->bigInteger('clicks')->default(0);
            $table->decimal('ctr', 10, 4)->default(0);
            $table->decimal('cost', 12, 2)->default(0);
            $table->decimal('avg_cpc', 10, 4)->default(0);

            $table->timestamps();

            // ✅ GOOD (you already fixed name length)
            $table->unique(
                ['ads_account_id','campaign_id','ad_id','date'],
                'gaa_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('google_ads_ads');
    }
};
