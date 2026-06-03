<?php

namespace App\Jobs\Simplifi;

use App\Services\SimplifiApiService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class SyncSimplifiAdsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    // public $timeout = 0;   // disable Laravel timeout
    // public $tries = 1;  
    public $timeout = 120;
    public $tries = 1;

    public function __construct(
        public string $apiKey,
        public int $organizationId,
        public int $accountId,
        public string $startDate,
        public string $endDate
    ) {}

    public function handle(SimplifiApiService $api)
    {

        set_time_limit(0);
        $dates = $this->getDatesBetween($this->startDate, $this->endDate);

        foreach ($dates as $date) {

            try {
               // ini_set('max_execution_time', 300);

                $campaigns = $api->getCampaignStatsonly(
                    $this->apiKey,
                    $this->organizationId,
                    $date,
                    $date
                );

                if (!$campaigns) {
                     DB::disconnect('mysql');
                    continue;
                }

                foreach ($campaigns as $campaign) {

                    if (empty($campaign['ads_merged'])) {
                        continue;
                    }

                    foreach ($campaign['ads_merged'] as $ad) {

                        DB::table('campaign_daily_stats')->updateOrInsert(
                            [
                                'organization_id' => $this->organizationId,
                                'account_id'      => $this->accountId,
                                'campaign_id'     => $campaign['campaign_id'],
                                'ad_id'           => $ad['ad_id'],
                                'stat_date'       => $date,
                            ],
                            [
                                'campaign_name'       => $campaign['campaign_name'] ?? null,
                                'ad_name'             => $ad['ad_name'] ?? null,
                                'impressions'         => $ad['impressions'] ?? 0,
                                'clicks'              => $ad['clicks'] ?? 0,
                                'ctr'                 => $ad['ctr'] ?? 0,
                                'total_spend'         => $ad['total_spend'] ?? 0,
                                'primary_creative_url'=> $ad['primary_creative_url'] ?? null,
                                'target_url'          => $ad['target_url'] ?? null,
                                'geofence'            => !empty($campaign['geofence'])
                                                          ? json_encode($campaign['geofence'])
                                                          : null,
                                'updated_at'          => now(),
                                'created_at'          => now(),
                            ]
                        );
                    }
                }

            } catch (\Throwable $e) {
                \Log::error('Simplifi Ads Sync Error', [
                    'org_id' => $this->organizationId,
                    'date'   => $date,
                    'error'  => $e->getMessage(),
                ]);
            }
             DB::disconnect('mysql');
        }
    }

    private function getDatesBetween(string $start, string $end): array
    {
        $dates = [];
        $current = Carbon::parse($start);
        $endDate = Carbon::parse($end);

        while ($current->lte($endDate)) {
            $dates[] = $current->toDateString();
            $current->addDay();
        }

        return $dates;
    }
}

