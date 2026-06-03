<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create google account table
        Schema::create('google_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('google_id');
            $table->string('name')->nullable();
            $table->string('email')->nullable();
            $table->string('token')->nullable();
            $table->string('refresh_token')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->string('access_type')->default('offline');
            $table->json('scopes'); // Store granted scopes
            $table->string('type')->nullable(); // e.g., "analytics", "search-console", "ads", "login"
            $table->boolean('is_connected')->default(false);
            $table->timestamps();

            // Composite unique constraint
            $table->unique(['google_id', 'type'], 'google_id_type_unique');
            $table->index(['user_id', 'google_id', 'type']);
        });

        // Create google service proterties table
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
        Schema::dropIfExists('google_accounts');
        Schema::dropIfExists('google_service_properties');
    }
};
