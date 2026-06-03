<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\SimplifiCampaignStat;
use App\Models\SimplifiAdStat;

use App\Models\SimplifiOrganizations;
use App\Services\SimplifiApiService;
use App\Models\SimplifiCampaign;
use App\Models\SimplifiCampaignGeofence;

class SyncSimplifiData extends Command
{
    protected $signature = 'sync:simplifi';
    protected $description = 'Sync Simplifi campaign stats';

    protected $simplifiApiService;

    public function __construct(SimplifiApiService $simplifiApiService)
    {
        parent::__construct();
        $this->simplifiApiService = $simplifiApiService;
    }

    public function handle()
    {
           $organizations = SimplifiOrganizations::with('account')->get();
            foreach ($organizations as $org) {
                $user_key = $org->account->api_key ?? null;
                $org_id   = $org->organization_id ?? null;
                if (!$user_key || !$org_id) continue;
                    $startDate = now()->subMonths(2)->toDateString();
                    $endDate   = now()->toDateString();
                     // $this->info("Fetching initial 2 months of simplifi data...");
                try {
                    ini_set('max_execution_time', 300);
                  //  $org_id = '515855';

                    $allCampaigns = $this->simplifiApiService->getCampaignStatsCron(
                        $user_key, $org_id, $startDate, $endDate
                    );

                    foreach ($allCampaigns as $campaign) {
                        $campaignId   = $campaign['campaign_id'] ?? null;
                        $campaignName = $campaign['campaign_name'] ?? null;
                        if (!$campaignId) continue;
                        SimplifiCampaign::updateOrCreate(
                            [
                                'organization_id'      => $org_id,
                                'campaign_id' => $campaignId,
                            ],
                            [
                                'campaign_name' => $campaignName,
                            ]
                        );


                        // ✅ Save GeoFence data (if exists)
                        if (!empty($campaign['geofence'])) {
                            foreach ($campaign['geofence'] as $geoFenceName) {
                                SimplifiCampaignGeofence::updateOrCreate(
                                    [
                                        'organization_id'      => $org_id,
                                        'campaign_id' => $campaignId,
                                        'name'        => $geoFenceName,
                                    ]
                                );
                            }
                        }

                        if (!empty($campaign['stats'])) {
                            foreach ($campaign['stats'] as $stats) {
                                SimplifiCampaignStat::updateOrCreate(
                                    [
                                        'org_id'      => $org_id,
                                        'campaign_id' => $campaignId,
                                        'stat_date'   => $stats['stat_date'] ?? now()->toDateString(),
                                    ],
                                    [
                                        'impressions'      => $stats['impressions'] ?? 0,
                                        'clicks'           => $stats['clicks'] ?? 0,
                                        'ctr'              => $stats['ctr'] ?? 0,
                                        'cpm'              => $stats['cpm'] ?? 0,
                                        'cpc'              => $stats['cpc'] ?? 0,
                                        'cpa'              => $stats['cpa'] ?? 0,
                                        'vcr'              => $stats['vcr'] ?? 0,
                                        'weighted_actions' => $stats['weighted_actions'] ?? 0,
                                        'total_spend'      => $stats['total_spend'] ?? 0,
                                    ]
                                );
                            }
                        }
                        }
                                            
                } catch (\Exception $e) {
                    \Log::error("Simplifi sync error for org {$org_id}: " . $e->getMessage());
                }
            }

    }


}
