<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('simplifi_campaign_stats', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('org_id');
            $table->unsignedBigInteger('account_id')->nullable();
            $table->unsignedBigInteger('campaign_id')->index();
            $table->date('stat_date');
            $table->string('geofence')->nullable();
            $table->bigInteger('impressions')->default(0);
            $table->bigInteger('clicks')->default(0);
            $table->decimal('ctr', 12, 6)->default(0);
            $table->decimal('cpm', 12, 6)->default(0);
            $table->decimal('cpc', 12, 6)->default(0);
            $table->decimal('cpa', 12, 6)->default(0);
            $table->decimal('vcr', 12, 6)->default(0);
            $table->decimal('weighted_actions', 12, 6)->default(0);
            $table->decimal('total_spend', 12, 6)->default(0);

            $table->timestamps();

            $table->unique(['campaign_id', 'stat_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('simplifi_campaign_stats');
    }
};
