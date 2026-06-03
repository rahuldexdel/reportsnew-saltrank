<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add the column
            $table->unsignedBigInteger('client_id')->nullable()->after('id');

            // Add foreign key constraint
            $table->foreign('client_id')->references('id')->on('clients')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop foreign key first, then column
            $table->dropForeign(['client_id']);
            $table->dropColumn('client_id');
        });
    }

    
};
