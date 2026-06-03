<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tab_summaries', function (Blueprint $table) {

            $table->id();

            $table->unsignedBigInteger('data_source_id')->nullable();
            $table->string('tab_key'); 

            $table->unsignedBigInteger('client_group_id')->nullable();
            $table->unsignedBigInteger('client_id')->nullable();

            // Save selected names also
            $table->string('client_name')->nullable();
            $table->string('client_group_name')->nullable();

            $table->string('title');
            $table->longText('summary')->nullable();

            // Dates
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tab_summaries');
    }
};