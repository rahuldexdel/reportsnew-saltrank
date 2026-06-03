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
        Schema::create('simpli_fi_reports', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('report_id');
            $table->bigInteger('schedule_id');
            $table->string('filename')->nullable(); 
            $table->text('report_data'); // store JSON data
            $table->string('download_url');
            $table->timestamp('received_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('simpli_fi_reports');
    }
};
