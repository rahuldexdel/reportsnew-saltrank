<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use Illuminate\Support\Facades\Log;


class Kernel extends ConsoleKernel
{
    /**
     * The Artisan commands provided by your application.
     *
     * @var array
     */
    protected $commands = [
        \App\Console\Commands\SyncSearchConsoleData::class,
    ];

    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule)
    {



        // $schedule->call(function () {
        //     \Log::info('Scheduler is working at ' . now());
        // })->everyMinute();   



        //     Log::info('🔥 Scheduler loaded');

        // $schedule->command('demo:cron-test')
        // ->everyTwoMinutes()
        // ->appendOutputTo(storage_path('logs/demo_cron.log'));
 
        // $schedule->job(new \App\Jobs\Simplifi\DailySimplifiSyncJob)
        //             ->everyMinute();


    }

    /**
     * Register the commands for the application.
     */
    protected function commands()
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
