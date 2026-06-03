<?php
namespace App\Jobs\Simplifi;

use App\Models\SimplifiAccount;
use App\Services\SimplifiApiService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class SyncSimplifiAccountDailyJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $accountId,
        public string $startDate,
        public string $endDate
    ) {}

    public function handle(SimplifiApiService $api)
    {
        $account = SimplifiAccount::findOrFail($this->accountId);

        $response = $api->fetchOrganizations($account->api_key);

        foreach ($response['organizations'] ?? [] as $org) {

            SyncSimplifiOrganizationDailyJob::dispatch(
                $account->id,
                $org['id'],
                $this->startDate,
                $this->endDate
            );
        }

        $account->update([
            'last_synced_at' => $this->endDate
        ]);
            DB::disconnect('mysql');

    }
}
