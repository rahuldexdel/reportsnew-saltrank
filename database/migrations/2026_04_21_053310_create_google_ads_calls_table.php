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
        Schema::create('google_ads_calls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ads_account_id')->index();
            $table->string('campaign_id')->nullable()->index(); // optional

            $table->date('date');
            $table->integer('total_calls')->default(0);

            $table->timestamps();

            $table->unique(['ads_account_id','campaign_id','date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('google_ads_calls');
    }
};
