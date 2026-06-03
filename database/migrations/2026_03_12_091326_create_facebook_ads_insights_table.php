<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('facebook_ads_insights', function (Blueprint $table) {

            $table->id();

            $table->unsignedBigInteger('account_id');
            $table->string('ad_account_id');

            $table->string('campaign_id')->nullable();
            $table->string('adset_id')->nullable();
            $table->string('ad_id')->nullable();

            $table->date('date')->nullable();

            $table->integer('impressions')->default(0);
            $table->integer('clicks')->default(0);
            $table->decimal('spend', 12, 2)->default(0);

            $table->decimal('ctr', 8, 4)->nullable();
            $table->decimal('cpc', 8, 4)->nullable();
            $table->integer('reach')->default(0);

            $table->string('age')->nullable();
            $table->string('gender')->nullable();
            $table->string('device_platform')->nullable();

            $table->json('metadata')->nullable();

            $table->timestamps();

            // Indexes for reporting
            $table->index('account_id');
            $table->index('ad_account_id');
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facebook_ads_insights');
    }
};