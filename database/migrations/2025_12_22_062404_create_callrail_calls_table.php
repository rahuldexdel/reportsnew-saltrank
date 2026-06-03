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
       Schema::create('callrail_calls', function (Blueprint $table) {
            $table->id();
            $table->string('callrail_id')->unique();
            $table->string('caller_number')->nullable();
            $table->integer('duration')->nullable();
            $table->string('source')->nullable();
            $table->boolean('answered')->default(false);
            $table->string('recording_url')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('callrail_calls');
    }
};
