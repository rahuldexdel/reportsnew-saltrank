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
        Schema::create('google_service_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained('google_service_properties')->onDelete('cascade');
            $table->date('report_date');
            $table->string('report_type'); // 'performance', 'traffic', 'conversions', etc.
            $table->string('dimension_1')->nullable(); // e.g., query, page, country
            $table->string('dimension_2')->nullable(); // secondary dimension
            $table->string('dimension_3')->nullable(); // tertiary dimension
            
            // Common metrics
            $table->integer('clicks')->nullable();
            $table->integer('impressions')->nullable();
            $table->float('ctr')->nullable();
            $table->float('position')->nullable();
            $table->integer('sessions')->nullable();
            $table->integer('users')->nullable();
            $table->float('bounce_rate')->nullable();
            $table->float('conversions')->nullable();
            
            $table->json('raw_data')->nullable(); // Store complete API response
            $table->timestamps();

            $table->index(['property_id', 'report_date', 'report_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('google_service_reports');
    }
};
