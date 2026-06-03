<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('callrail_companies', function (Blueprint $table) {
            $table->id();

            $table->string('call_rail_account_id'); // 325-476-338
            $table->unsignedBigInteger('user_id');

            $table->string('company_id')->unique(); // COMxxxx
            $table->string('name');

            $table->string('service_type')->default('callrail');
            $table->string('property_id')->nullable();

            $table->string('permission_level')->nullable();
            $table->boolean('is_verified')->default(true);
            $table->boolean('is_assigned')->default(false);

            $table->unsignedBigInteger('client_id')->nullable();

            $table->boolean('is_active')->default(true);
            $table->timestamp('last_synced_at')->nullable();

            $table->json('metadata')->nullable();

            $table->timestamps();

            // Optional indexes
            $table->index('call_rail_account_id');
            $table->index('client_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('callrail_companies');
    }
};