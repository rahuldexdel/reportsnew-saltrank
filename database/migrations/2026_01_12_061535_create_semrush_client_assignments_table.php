<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('semrush_client_assignments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('semrush_account_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();

            $table->string('domain');
            $table->string('database')->default('us');

            $table->timestamps();

            $table->unique(['client_id', 'domain']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('semrush_client_assignments');
    }
};
