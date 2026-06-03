<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
            Schema::create('ga4_metrics', function (Blueprint $table) {
                $table->id();

                $table->foreignId('google_service_property_id')
                    ->constrained()
                    ->cascadeOnDelete();
                $table->string('report_type'); 

                // dimensions
                $table->date('metric_date')->nullable();
                $table->string('dimension_name')->nullable();
                $table->string('dimension_value')->nullable();

                // metrics
                $table->unsignedBigInteger('sessions')->nullable();
                $table->unsignedBigInteger('engaged_sessions')->nullable();
                $table->unsignedBigInteger('views')->nullable();
                $table->unsignedBigInteger('users')->nullable();
                $table->unsignedBigInteger('event_count')->nullable();

                $table->decimal('engagement_rate', 6, 2)->nullable();
                $table->decimal('avg_engagement_time', 10, 2)->nullable();

                // future-proof
                $table->json('extra')->nullable();

                $table->timestamps();

                $table->unique([
                    'google_service_property_id',
                    'report_type',
                    'metric_date',
                    'dimension_name',
                    'dimension_value'
                ], 'ga4_metrics_unique');
            });

    }

    public function down(): void
    {
        Schema::dropIfExists('ga4_metrics');
    }
};
