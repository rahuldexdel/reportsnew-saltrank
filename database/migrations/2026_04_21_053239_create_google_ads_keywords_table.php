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
        Schema::create('google_ads_keywords', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ads_account_id')->index();
            $table->string('campaign_id')->index(); // ✅ REQUIRED

            $table->string('keyword')->index();

            $table->bigInteger('impressions')->default(0);
            $table->bigInteger('clicks')->default(0);
            $table->decimal('ctr',10,4)->nullable();
            $table->decimal('cost',12,2)->default(0);

            $table->date('date');
            $table->timestamps();

        $table->unique(
                ['ads_account_id','campaign_id','keyword','date'],
                'gak_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('google_ads_keywords');
    }
};
