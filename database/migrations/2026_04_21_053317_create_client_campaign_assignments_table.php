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
        Schema::create('client_campaign_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->index();
            $table->string('campaign_id')->index();
            $table->foreignId('ads_account_id')->index();
            $table->timestamps();

            $table->unique(['client_id','campaign_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('client_campaign_assignments');
    }
};
