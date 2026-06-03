<?php

namespace App\Jobs\Simplifi;

use App\Models\SimplifiAccount;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class DailySimplifiSyncJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle()
    {

    \Log::info('DailySimplifiSyncJob executed');

        $accounts = SimplifiAccount::where('is_connected', true)->get();

        foreach ($accounts as $account) {


            $startDate = $account->last_synced_at
                ? Carbon::parse($account->last_synced_at)->addDay()
                : now()->subDay();
            $endDate = now()->subDay(); // sync yesterday only (safe)
            if ($startDate->gt($endDate)) {
                continue;

            }
    
            SyncSimplifiAccountDailyJob::dispatch(
                $account->id,
                $startDate->toDateString(),
                $endDate->toDateString()
            );
        }
    }
}
