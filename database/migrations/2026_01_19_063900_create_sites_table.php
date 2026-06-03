<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sites', function (Blueprint $table) {

            $table->id();

            $table->foreignId('semrush_account_id')
                ->constrained()
                ->onDelete('cascade');

            $table->unsignedBigInteger('project_id')->nullable();

            $table->string('project_name')->nullable();

            $table->string('domain')->nullable();

            $table->unsignedBigInteger('client_id')->nullable();

            $table->string('domain_unicode')->nullable();

            $table->json('tools')->nullable();

            $table->unsignedBigInteger('owner_id')->nullable();

            $table->json('permission')->nullable();

            $table->string('database')->default('us');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sites');
    }
};