<?php


namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\SearchConsoleData;
use App\Services\GoogleAuthService;
use App\Services\SearchConsoleService;

class SyncSearchConsoleData extends Command
{
    protected $signature = 'sync:search-console';
    protected $description = 'Sync Google Search Console data once every 24 hours';

    protected $googleAuthService;
    protected $searchConsoleService;

    public function __construct(GoogleAuthService $googleAuthService, SearchConsoleService $searchConsoleService)
    {
        parent::__construct();
        $this->googleAuthService = $googleAuthService;
        $this->searchConsoleService = $searchConsoleService;
    }

        public function handle()
        {

            $userId = 3;
            $accessToken = $this->googleAuthService->getValidAccessToken($userId, 'search-console');
            // Check if we already have data for this user
            $hasData = SearchConsoleData::where('user_id', $userId)->exists();
         
            if (!$hasData) {
                $startDate = now()->subMonths(2)->toDateString();
                $endDate   = now()->toDateString();
                $this->info("Fetching initial 2 months of Search Console data...");
            } else {
                $startDate = now()->subDay()->toDateString();
                $endDate   = now()->toDateString();
                $this->info("Fetching daily Search Console data for {$startDate}.");
            }
            $data = $this->searchConsoleService->fetchAllSearchConsoleData(
                $accessToken, $startDate, $endDate
            );
            $this->saveSearchConsoleData($data, $userId);
            $this->info("Search Console data synced successfully from {$startDate} to {$endDate}.");
        }


        private function saveSearchConsoleData($searchConsoleData, $userId)
        {
            foreach ($searchConsoleData as $site) {
                $siteUrl = $site['site_url'] ?? null;

                if (!empty($site['data']['rows'])) {
                    foreach ($site['data']['rows'] as $row) {
                        SearchConsoleData::updateOrCreate(
                            [
                                'user_id' =>  $userId,
                                'site_url'  => $siteUrl,
                                'date'      => $row['keys'][0],
                                'query'     => $row['keys'][1] ?? null,
                                'page_url'  => $row['keys'][2] ?? null,
                                'device'    => $row['keys'][3] ?? null,
                            ],
                            [
                                'clicks'     => $row['clicks'] ?? 0,
                                'impressions'=> $row['impressions'] ?? 0,
                                'ctr'        => $row['ctr'] ?? 0,
                                'position'   => $row['position'] ?? null,
                            ]
                        );
                    }
                }
            }
        }
}
