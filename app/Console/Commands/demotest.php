<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
class demotest extends Command
{


    /**
     * The name and signature of the console command.
     *
     * @var string
     */
protected $signature = 'demo:cron-test';


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
            $time = now()->toDateTimeString();

            Log::info('✅ DemoCronTest ran at ' . $time);

            $this->info('DemoCronTest executed at ' . $time);

            return 0;
        }

}
