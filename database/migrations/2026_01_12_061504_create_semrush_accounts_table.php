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
            Schema::create('semrush_accounts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
               // $table->text('domain');
                $table->text('api_key');
                $table->string('default_database')->default('us');
                $table->string('status')->default('connected');

                $table->timestamps();
            });
        }

        public function down(): void
        {
            Schema::dropIfExists('semrush_accounts');
        }
};
