<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
{
    Schema::table('semrush_tracking_positions', function (Blueprint $table) {
        $table->unique(
            ['semrush_campaign_id', 'prompt_id'],
            'semrush_tracking_unique'
        );

        $table->foreign('semrush_campaign_id')
            ->references('id')
            ->on('semrush_campaigns')
            ->onDelete('cascade');
    });
}

public function down(): void
{
    Schema::table('semrush_tracking_positions', function (Blueprint $table) {
        $table->dropForeign(['semrush_campaign_id']);
        $table->dropUnique('semrush_tracking_unique');
    });
}
};
