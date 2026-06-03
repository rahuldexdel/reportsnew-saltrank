<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');



use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schedule;    
use App\Jobs\FetchSemrushDataJob;
use App\Models\Site;
use App\Jobs\Simplifi\DailySimplifiSyncJob;

/*
|--------------------------------------------------------------------------
| Console Routes
|--------------------------------------------------------------------------
*/


Schedule::call(function () {
    Site::whereNotNull('semrush_account_id')
        ->chunk(50, function ($sites) {
            foreach ($sites as $site) {
                FetchSemrushDataJob::dispatch(
                    $site->id,
                    false
                );
            }
        });

})->dailyAt('02:00');


// Schedule::command('ai:generate-monthly')
//     ->name('daily_ai_sync')
//     ->withoutOverlapping();

// Schedule::job(new DailySimplifiSyncJob)
//     ->everyMinute()
//     ->name('daily_simplifi_sync')
//     ->withoutOverlapping();

