<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use phpDocumentor\Reflection\Types\Nullable;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // create client table
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('company_name')->nullable();
            $table->string('logo')->nullable();
            $table->string('data_dashboard')->nullable();
            $table->enum('status', [
                'Active', 
                'Pending Assignment', 
                'Hold', 
                'Terminated'
            ])->default('Active');
            $table->timestamps();
            $table->softDeletes();
        });

        // create client groupe table
         Schema::create('client_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('client_group_dashboard');
            $table->timestamps();
            $table->softDeletes();
        });

        // create client client_groupe pivort table
        Schema::create('client_client_group', function (Blueprint $table) {
            $table->unsignedBigInteger('client_id');
            $table->unsignedBigInteger('client_group_id');
            
            $table->foreign('client_id')->references('id')->on('clients')->onDelete('cascade');
            $table->foreign('client_group_id')->references('id')->on('client_groups')->onDelete('cascade');
            
            $table->primary(['client_id', 'client_group_id']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clients');
        Schema::dropIfExists('client_groups');
        Schema::dropIfExists('client_client_group');
    }
};
