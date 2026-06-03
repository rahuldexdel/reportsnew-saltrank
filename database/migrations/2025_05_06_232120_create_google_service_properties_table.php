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
        Schema::create('google_service_properties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('google_account_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('service_type');
            $table->string('property_id');
            $table->string('property_name')->nullable();
            $table->string('permission_level')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->boolean('is_assigned')->default(false);
            $table->foreignId('client_id')->nullable()->constrained()->onDelete('set null');
            $table->boolean('is_active')->default(true);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['google_account_id', 'service_type', 'property_id'], 'google_service_properties_unique' );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('google_service_properties');
    }
};
