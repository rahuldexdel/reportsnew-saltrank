<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class RunDailySimplifiSync extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'run:dailysimplifi';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        //

            \App\Jobs\Simplifi\DailySimplifiSyncJob::dispatchSync();
             $this->info('Job executed');

    }
}
