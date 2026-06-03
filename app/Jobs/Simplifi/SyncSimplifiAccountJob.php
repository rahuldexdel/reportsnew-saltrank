<?php
namespace App\Jobs\Simplifi;

use App\Models\SimplifiAccount;
use App\Models\SimplifiOrganizations;
use App\Services\SimplifiApiService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SyncSimplifiAccountJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $accountId) {}

    public function handle(SimplifiApiService $api)
    {
        $account = SimplifiAccount::findOrFail($this->accountId);

        $account->update(['sync_status' => 'syncing']);

        $response = $api->fetchOrganizations($account->api_key);

        foreach ($response['organizations'] ?? [] as $org) {

            SimplifiOrganizations::updateOrCreate(
                [
                    'account_id'      => $account->id,
                    'organization_id' => $org['id'],
                ],
                [
                    'name' => $org['name'],
				    'custom_id' => $org['custom_id'],
					'ancestry' => $org['ancestry'],
					'public_key' => $org['public_key'],
					'website' => $org['website'],
                ]
            );

            // 🔥 dispatch org-level sync
            SyncSimplifiOrganizationJob::dispatch(
                $account->id,
                $org['id']
            );
        }

        $account->update([
            'last_synced_at' => now()->toDateString(),
        ]);


    }
}
