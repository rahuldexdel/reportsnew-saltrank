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
        // create account
        Schema::create('simplifi_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('account_id');
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('api_key')->unique();
            $table->boolean('is_connected')->default(false);
            $table->timestamps();
        });

        // Create organizations table
        Schema::create('simplifi_organizations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('simplifi_accounts')->onDelete('cascade');
            $table->integer('organization_id');
            $table->string('name')->nullable();
            $table->string('custom_id')->nullable();
            $table->string('ancestry')->nullable();
            $table->string('public_key')->nullable();
            $table->string('website')->nullable();
            $table->boolean('is_assigned')->default(false);
            $table->foreignId('client_id')->nullable()->constrained()->onDelete('set null');
            $table->timestamps();
        });

        // Create campaigns table
        Schema::create('simplifi_campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('simplifi_organizations')->onDelete('cascade');
            $table->integer('campaign_id');
            $table->string('name')->nullable();
            $table->string('custom_id')->nullable();
            $table->float('current_win_rate')->default(0);
            $table->float('daily_budget')->nullable();
            $table->boolean('auto_adjust_daily_budget')->nullable()->default(false);
            $table->float('monthly_budget')->nullable();
            $table->float('total_budget')->nullable();
            $table->string('status')->nullable();
            $table->integer('impression_cap')->nullable();
            $table->integer('daily_impression_cap')->nullable();
            $table->integer('monthly_impression_cap')->nullable();
            $table->boolean('auto_adjust_daily_impression_cap')->nullable()->default(false);
            $table->float('pacing')->nullable();
            $table->boolean('automated_pacing_enabled')->default(false);
            $table->integer('media_type_id')->nullable();
            $table->string('segment_match_type')->nullable();
            $table->boolean('auto_optimize')->nullable()->default(false);
            $table->integer('click_attribution_window')->nullable();
            $table->integer('view_attribution_window')->nullable();
            $table->boolean('org_blocklist_opt_out')->nullable()->default(false);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->float('bid')->nullable();
            $table->boolean('is_assigned')->default(false);
            $table->foreignId('client_id')->nullable()->constrained()->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('simplifi_accounts');
        Schema::dropIfExists('simplifi_organizations');
        Schema::dropIfExists('simplifi_campaigns');
    }
};
