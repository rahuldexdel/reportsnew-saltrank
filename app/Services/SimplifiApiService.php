<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class SimplifiApiService
{
    private Client $client;

    /**
     * __construct new client
     */
    public function __construct()
    {
        $this->client = new Client([
            'base_uri' => config('services.simplifi.api_url', 'https://app.simpli.fi'),
            'timeout' => 20.0,
            'headers' => [
                'Content-Type' => 'application/json',
                'X-App-Key' => config('services.simplifi.app_key')
            ]
        ]);
    }

    /**
     * Get and connect Simplify user account
     * @param mixed $user_key
     * @throws \Exception
     */
    public function connect($user_key)
    {
        try {
            $response = $this->client->get("api", [
                'headers' => [
                    'X-User-Key' => $user_key
                ]
            ]);

            return json_decode($response->getBody()->getContents(), true);
        } catch (RequestException $e) {
            throw new \Exception('Failed to connect account: ' . $e->getMessage());
        }
    }

    /**
     * Fetch Simplifi organizations
     * @param mixed $user_key
     * @throws \Exception
     */
    public function fetchOrganizations($user_key)
    {
        try {
            $response = $this->client->get("api/organizations", [
                'headers' => [
                    'X-User-Key' => $user_key
                ]
            ]);

            return json_decode($response->getBody()->getContents(), true);
        } catch (RequestException $e) {
            throw new \Exception('Failed to fetch organizations: ' . $e->getMessage());
        }
    }

    /**
     * Fetch Simplifi organizations
     * @param mixed $user_key
     * @throws \Exception
     */
    public function fetchCampaigns($user_key, $org_id)
    {
        try {
            $response = $this->client->get("api/organizations/{$org_id}/campaigns", [
                'headers' => [
                    'X-User-Key' => $user_key
                ]
            ]);

            return json_decode($response->getBody()->getContents(), true);
        } catch (RequestException $e) {
            throw new \Exception('Failed to fetch organizations: ' . $e->getMessage());
        }
    }

    /**
     * Summary of campaignStats
     * @param mixed $user_key
     * @param mixed $org_id
     * @throws \Exception
     */
    public function campaignStats($user_key, $org_id, $from, $to)
    {
        try {
            $response = $this->client->get("api/organizations/{$org_id}/campaign_stats?by_campaign=true&end_date={$to}&start_date={$from}", [
                'headers' => [
                    'X-User-Key' => $user_key
                ]
            ]);

            return json_decode($response->getBody()->getContents(), true);
        } catch (RequestException $e) {
            throw new \Exception('Failed to fetch organizations stats: ' . $e->getMessage());
        }
    }

  




// public function getCampaignStats($userKey, $orgId, $from, $to, $withGeoFences = false)
// {
//     try {
//        /// $orgId = 513445;

//         $statsUrl = "api/organizations/{$orgId}/campaign_stats?by_campaign=true&by_day=true&start_date={$from}&end_date={$to}";
//         $stats = collect($this->getJsonWithRetry($statsUrl, $userKey)['campaign_stats'] ?? []);

//         $campaigns = collect($this->getJsonWithRetry("api/organizations/{$orgId}/campaigns", $userKey)['campaigns'] ?? []);

//         if (!$withGeoFences) {
//             return $stats->map(function ($stat) use ($campaigns) {
//                 $campaign = $campaigns->firstWhere('id', $stat['campaign_id']);
//                 $stat['campaign_name'] = $campaign['name'] ?? null;
//                 return $stat;
//             })->values()->all();
//         }

//         // Fetch geo fences with retry
//         return $stats->map(function ($stat) use ($campaigns, $userKey, $orgId) {
//             $campaign = $campaigns->firstWhere('id', $stat['campaign_id']);
//             $geoFences = $this->getJsonWithRetry(
//                 "api/organizations/{$orgId}/campaigns/{$stat['campaign_id']}/geo_fences",
//                 $userKey
//             )['geo_fences'] ?? [];

//             $stat['campaign_name'] = $campaign['name'] ?? null;
//             $stat['geo_fence_names'] = array_column($geoFences, 'name');
//             return $stat;
//         })->values()->all();

//     } catch (\Exception $e) {
//         throw new \Exception('Failed to fetch campaign stats: ' . $e->getMessage());
//     }
// }



public function getJsonWithRetry($url, $userKey, $maxRetries = 5)
{
    $delay = 1; // start with 1 second
    for ($i = 0; $i < $maxRetries; $i++) {
        try {
            return $this->getJson($url, $userKey);
        } catch (\Exception $e) {
            if (strpos($e->getMessage(), '429') !== false) {
                sleep($delay);
                $delay *= 2; 
            } else {
                throw $e; 
            }
        }
    }
    throw new \Exception("API rate limit exceeded after {$maxRetries} retries for URL: {$url}");
}


private function getJson($url, $userKey)
{
    $response = $this->client->get($url, [
        'headers' => [
            'X-User-Key' => $userKey,
            'Accept' => 'application/json',
        ]
    ]);
    return json_decode($response->getBody()->getContents(), true);
}


public function getCampaignStatsWithAds($user_key, $org_id, $startDate, $endDate)
{

    try {

        $campaignsResponse = $this->getJsonWithRetry("api/organizations/{$org_id}/campaigns", $user_key);
        $campaigns = collect($campaignsResponse['campaigns'] ?? []);
        $results = [];
        foreach ($campaigns as $campaign) {
            $campaignId   = $campaign['id'];
            $campaignName = $campaign['name'];
            $statsUrl = "api/organizations/{$org_id}/campaign_stats?" . http_build_query([
                'campaign_id' => $campaignId,
                'by_ad'      => 'true',
                'by_day'     => 1,
                'start_date'  => $startDate,
                'end_date'    => $endDate,
            ]);
            $campaignStats = $this->getJsonWithRetry($statsUrl, $user_key);
            $dailyStats    = $campaignStats['campaign_stats'] ?? [];


            $adsUrl = "api/organizations/{$org_id}/campaigns/{$campaignId}/ads?" . http_build_query([
                'size'            => 100,
                'page'            => 1,
                'attributes_only' => true,
            ]);
            $adsResponse = $this->getJsonWithRetry($adsUrl, $user_key);
            $ads = array_filter($adsResponse['ads'] ?? [], function ($ad) {
                return isset($ad['status']) && $ad['status'] === 'Active';
            });


            $geoResponse = $this->getJsonWithRetry(
                        "api/organizations/{$org_id}/campaigns/{$campaignId}/geo_fences",
                        $user_key
                    );
            $geofences = [];
                if (isset($geoResponse['geo_fences']) && is_array($geoResponse['geo_fences'])) {
                    $geofences = array_map(function ($geofence) {
                        return $geofence['name'] ?? null;  // Safely return the name or null if not present
                    }, $geoResponse['geo_fences']);
                }



                $adsWithStats = [];
                foreach ($ads as $ad) {
                    $adId   = $ad['id'];
                    $adName = $ad['name'];
                    $target_url = $ad['target_url'];
                    $primary_creative = $ad['primary_creative'];
                    $primary_creative_url = $ad['primary_creative_url'];
                    $adStats = [];
                    foreach ($dailyStats as $stat) {
                        if ($stat['ad_id'] == $adId) {
                            $adStats[] = [
                                'stat_name'     => $stat['name'],
                                'impressions'   => $stat['impressions'],
                                'clicks'        => $stat['clicks'],
                                'ctr'           => $stat['ctr'],
                                'cpm'           => $stat['cpm'],
                                'cpc'           => $stat['cpc'],
                                'cpa'           => $stat['cpa'],
                                'total_spend'   => $stat['total_spend'],
                            ];
                        }
                    }
                    $adsWithStats[] = [
                        'ad_id'   => $adId,
                        'ad_name' => $adName,
                        'target_url'  => $target_url,
                        'primary_creative'  => $primary_creative,
                        'primary_creative_url' => $primary_creative_url,
                        'stats'   => $adStats,  
                    ];
                }
                $results[] = [
                    'campaign_id'   => $campaignId,
                    'campaign_name' => $campaignName,
                    'ads'           => $adsWithStats,  
                    'geofence'      => $geofences,    
                ];
        }
        return $results;

    } catch (\Exception $e) {
        \Log::error("Failed to fetch campaign stats with ads for org {$org_id}: " . $e->getMessage());
        return [];
    }
}



        public function getCampaignStatsonly($user_key, $org_id, $startDate, $endDate)
        {
            try {
                // Get all campaigns
                $campaignsResponse = $this->getJsonWithRetry("api/organizations/{$org_id}/campaigns", $user_key);
                $campaigns = collect($campaignsResponse['campaigns'] ?? []);
                $results = [];

                foreach ($campaigns as $campaign) {
                    $campaignId   = $campaign['id'];
                    $campaignName = $campaign['name'];

                    // --- Get campaign stats ---
                    $statsUrl = "api/organizations/{$org_id}/campaign_stats?" . http_build_query([
                        'campaign_id'  => $campaignId,
                        'by_ad'        => 'true',
                        'by_campaign'  => 'true',
                        'start_date'   => $startDate,
                        'end_date'     => $endDate,
                    ]);
                    $campaignStatsResponse = $this->getJsonWithRetry($statsUrl, $user_key);
                    $campaignStats = $campaignStatsResponse['campaign_stats'] ?? [];

                    // --- Get ads list ---
                    $adsUrl = "api/organizations/{$org_id}/campaigns/{$campaignId}/ads?" . http_build_query([
                        'size'            => 100,
                        'page'            => 1,
                        'attributes_only' => true,
                    ]);
                    $adsResponse = $this->getJsonWithRetry($adsUrl, $user_key);
                    $adsData = array_filter($adsResponse['ads'] ?? [], function ($ad) {
                        return isset($ad['status']) && $ad['status'] === 'Active';
                    });

                    // --- Create lookup for adsData ---
                    $adsLookup = [];
                    foreach ($adsData as $ad) {
                        $adsLookup[$ad['id']] = $ad;
                    }

                    // --- Merge stats and ad data ---
                    $mergedAds = [];
                    foreach ($campaignStats as $stat) {
                        $adId = $stat['ad_id'] ?? null;
                        if ($adId && isset($adsLookup[$adId])) {
                            $adInfo = $adsLookup[$adId];
                            $mergedAds[] = [
                                'ad_id' => $adId,
                                'ad_name' => $adInfo['name'] ?? null,
                                'status' => $adInfo['status'] ?? null,
                                'impressions' => $stat['impressions'] ?? 0,
                                'clicks' => $stat['clicks'] ?? 0,
                                'ctr' => $stat['ctr'] ?? 0,
                                'total_spend' => $stat['total_spend'] ?? 0,
                                'primary_creative_url' => $adInfo['primary_creative_url'] ?? null,
                                'target_url' => $adInfo['target_url'] ?? null,
                            ];
                        }
                    }

                    $geoFences = $this->getJsonWithRetry(
                        "api/organizations/{$org_id}/campaigns/{$campaignId}/geo_fences",
                            $user_key
                        )['geo_fences'] ?? [];


                        // --- Add to final results ---
                        $results[] = [
                            'campaign_id'   => $campaignId,
                            'campaign_name' => $campaignName,
                            'ads_merged'    => $mergedAds,
                            'geofence' => array_column($geoFences, 'name'),
                        ];

                }

                return $results;

            } catch (\Exception $e) {
                \Log::error("Failed to fetch campaign stats with ads for org {$org_id}: " . $e->getMessage());
                return [];
            }
        }


public function getCampaignStatsCron($user_key, $org_id, $startDate, $endDate)
{

     try {


           $campaignsResponse = $this->getJsonWithRetry("api/organizations/{$org_id}/campaigns", $user_key);
            $campaigns = collect($campaignsResponse['campaigns'] ?? []);
            $results = [];
            foreach ($campaigns as $campaign) {
                $campaignId   = $campaign['id'];
                $campaignName = $campaign['name'];
                $statsUrl = "api/organizations/{$org_id}/campaign_stats?" . http_build_query([
                    'campaign_id' => $campaignId,
                    'by_day'     => 'true',
                    'by_campaign' => 'true',
                    'start_date'  => $startDate,
                    'end_date'    => $endDate,
                ]);
                $campaignStats = $this->getJsonWithRetry($statsUrl, $user_key);
   

                $geoFences = $this->getJsonWithRetry(
                      "api/organizations/{$org_id}/campaigns/{$campaignId}/geo_fences",
                        $user_key
                    )['geo_fences'] ?? [];


                //$results[$org_id]    = $campaignStats['campaign_stats'] ?? [];
                    $results[] = [
                        'campaign_id'   => $campaignId,
                        'campaign_name' => $campaignName,
                        'stats' =>  $campaignStats['campaign_stats'] ?? [],
                    ];
             }

            // echo "<pre>";
            // print_r($results);
            // echo "</pre>";
            // dd('dddd');

            return $results;


        } catch (\Exception $e) {
            \Log::error("Failed to fetch campaign stats with ads for org {$org_id}: " . $e->getMessage());
            return [];
        }
}






}