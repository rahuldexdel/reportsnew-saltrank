<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('simplifi_campaigns_data', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('org_id');
            $table->unsignedBigInteger('account_id')->nullable();
            $table->unsignedBigInteger('campaign_id')->index();
            $table->string('campaign_name')->nullable();
            $table->timestamps();

            $table->unique(['org_id', 'campaign_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('simplifi_campaigns');
    }
};
