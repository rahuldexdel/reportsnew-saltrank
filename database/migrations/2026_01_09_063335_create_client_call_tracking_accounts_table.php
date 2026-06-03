<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateClientCallTrackingAccountsTable extends Migration
{
    public function up()
    {
        Schema::create('client_call_tracking_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->foreignId('call_tracking_account_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

           $table->unique(['client_id', 'call_tracking_account_id'], 'client_calltracking_unique');

        });
    }

    public function down()
    {
        Schema::dropIfExists('client_call_tracking_accounts');
    }
}
