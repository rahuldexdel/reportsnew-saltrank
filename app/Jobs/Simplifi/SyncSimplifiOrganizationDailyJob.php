<?php

namespace App\Jobs\Simplifi;

use App\Models\SimplifiAccount;
use App\Models\SimplifiCampaign;
use App\Models\SimplifiCampaignStat;
use App\Services\SimplifiApiService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SyncSimplifiOrganizationDailyJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $accountId,
        public int $organizationId,
        public string $startDate,
        public string $endDate
    ) {}

    public function handle(SimplifiApiService $api)
    {
        $account = SimplifiAccount::findOrFail($this->accountId);

        $campaigns = $api->getCampaignStatsCron(
            $account->api_key,
            $this->organizationId,
            $this->startDate,
            $this->endDate
        );

        foreach ($campaigns ?? [] as $campaign) {

            if (empty($campaign['campaign_id'])) continue;

            SimplifiCampaign::updateOrCreate(
                [
                    'account_id'      => $account->id,
                    'organization_id' => $this->organizationId,
                    'campaign_id'     => $campaign['campaign_id'],
                ],
                [
                    'campaign_name' => $campaign['campaign_name'],
                ]
            );

            foreach ($campaign['stats'] ?? [] as $stat) {
                SimplifiCampaignStat::updateOrCreate(
                    [
                        'account_id'  => $account->id,
                        'org_id'      => $this->organizationId,
                        'campaign_id' => $campaign['campaign_id'],
                        'stat_date'   => $stat['stat_date'],
                    ],
                    [
                        'impressions' => $stat['impressions'] ?? 0,
                        'clicks'      => $stat['clicks'] ?? 0,
                        'ctr'         => $stat['ctr'] ?? 0,
                        'cpm'         => $stat['cpm'] ?? 0,
                        'cpc'         => $stat['cpc'] ?? 0,
                        'cpa'         => $stat['cpa'] ?? 0,
                        'vcr'         => $stat['vcr'] ?? 0,
                        'weighted_actions' => $stat['weighted_actions'] ?? 0,
                        'total_spend' => $stat['total_spend'] ?? 0,
                    ]
                );
            }
        }

        // reuse existing Ads job
        SyncSimplifiAdsJob::dispatch(
            $account->api_key,
            $this->organizationId,
            $account->id,
            $this->startDate,
            $this->endDate
        );
    }
}
