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
            Schema::create('ai_insights', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('client_id')->nullable();

            $table->date('start_date');
            $table->date('end_date');

            $table->json('data'); // FULL AI JSON

            $table->timestamp('last_synced_at')->nullable();

            $table->timestamps();

            $table->unique(['client_id', 'start_date', 'end_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_insights');
    }
};
