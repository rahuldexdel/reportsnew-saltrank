<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Exception;
use App\Services\GoogleAdsService; // Ensure this is your correct service namespace
use App\Models\GoogleAccount;
use App\Models\GoogleServiceProperty;
use Illuminate\Support\Facades\Log;
use Google\Ads\GoogleAds\V22\Enums\DeviceEnum\Device;
use Google\Ads\GoogleAds\V22\Enums\GeoTargetingTypeEnum\GeoTargetingType;
use Google\Ads\GoogleAds\V22\Enums\GenderTypeEnum\GenderType;
use Google\Ads\GoogleAds\V22\Enums\AgeRangeTypeEnum\AgeRangeType;
use Google\Ads\GoogleAds\V22\Enums\AdTypeEnum\AdType;
use Google\Ads\GoogleAds\V22\Enums\CallStatusEnum\CallStatus;
use Google\Ads\GoogleAds\V22\Enums\AssetFieldTypeEnum\AssetFieldType;
use Google\Ads\GoogleAds\V22\Enums\AdvertisingChannelTypeEnum\AdvertisingChannelType;

class GoogleAdsControllerApi extends Controller
{



  private function allowedPropertyIds(?int $clientId, ?int $groupId)
        {
            $query = \App\Models\GoogleAdsCampaign::query()
        // ✅ Always apply clean data rules (for admin also)
        ->where('is_assigned', 1)
        ->whereNotNull('client_id');

            // ✅ Super Admin
            if (!$clientId && !$groupId) {
                return $query->pluck('campaign_id');
            }

           $query->where('is_assigned', 1)
          ->whereNotNull('client_id');

            if ($clientId) {
                $query->where('client_id', $clientId);
            } elseif ($groupId) {
                $clientIds = DB::table('client_client_group')
                    ->where('client_group_id', $groupId)
                    ->pluck('client_id');

                $query->whereIn('client_id', $clientIds);
            }

            return $query->pluck('campaign_id');
        }

private function resolveDateRange(Request $request): array
{
    $range = $request->query('range', '7');

    // Clean up string wrapper if present (e.g., 'range=7')
    if (is_string($range) && str_starts_with($range, 'range=')) {
        $range = str_replace('range=', '', $range);
    }

    // 1. Handle Custom Date Ranges (e.g., "2026-05-01:2026-06-10")
    if (is_string($range) && strpos($range, ':') !== false) {
        [$startStr, $endStr] = explode(':', $range);

        $start = \Illuminate\Support\Carbon::parse(trim($startStr));
        $end   = \Illuminate\Support\Carbon::parse(trim($endStr));
        $days  = $start->diffInDays($end) + 1;

        return [
            'start'         => $start->format('Y-m-d'),
            'end'           => $end->format('Y-m-d'),
            'previousStart' => $start->copy()->subDays($days)->format('Y-m-d'),
            'previousEnd'   => $start->copy()->subDay()->format('Y-m-d'),
        ];
    }

    // 2. Handle Presets and Relative Day Numbers (7, 30, this_month, last_month)
    switch ((string)$range) {
        case '30':
            return [
                'start'         => now()->subDays(30)->format('Y-m-d'),
                'end'           => now()->format('Y-m-d'),
                'previousStart' => now()->subDays(60)->format('Y-m-d'),
                'previousEnd'   => now()->subDays(31)->format('Y-m-d'),
            ];

        case 'this_month':
            return [
                'start'         => now()->startOfMonth()->format('Y-m-d'),
                'end'           => now()->format('Y-m-d'),
                'previousStart' => now()->subMonth()->startOfMonth()->format('Y-m-d'),
                'previousEnd'   => now()->subMonth()->endOfMonth()->format('Y-m-d'),
            ];

        case 'last_month':
            return [
                'start'         => now()->subMonth()->startOfMonth()->format('Y-m-d'),
                'end'           => now()->subMonth()->endOfMonth()->format('Y-m-d'),
                'previousStart' => now()->subMonths(2)->startOfMonth()->format('Y-m-d'),
                'previousEnd'   => now()->subMonths(2)->endOfMonth()->format('Y-m-d'),
            ];

        case '7':
        default:
            return [
                'start'         => now()->subDays(7)->format('Y-m-d'),
                'end'           => now()->format('Y-m-d'),
                'previousStart' => now()->subDays(14)->format('Y-m-d'),
                'previousEnd'   => now()->subDays(8)->format('Y-m-d'),
            ];
    }
}
    
public function overview(Request $request, GoogleAdsService $apiService)
{
    set_time_limit(120);
    $clientId = $request->client_id;
    $groupId  = $request->group_id;

    $range = $this->resolveDateRange($request);
   $campaignIds = $this->allowedPropertyIds($clientId, $groupId)->toArray();


   //dd($campaignIds);
    // 1. Fetch Google Account & Property configuration dynamically
    $account = GoogleAccount::where('type', 'ads')
        ->where('is_connected', true)
        ->first();

    if (!$account) {
        return response()->json(['error' => 'No connected Google Ads account found.'], 404);
    }

        // 1. Initial Query: Start with base active 'ads' conditions
        $query = GoogleServiceProperty::where('service_type', 'ads')
            ->where('is_active', 1);

        // 2. Conditional Filter: If client_id is provided, look for that specific one first
        if (!empty($clientId)) {
            $property = (clone $query)->where('client_id', $clientId)->first();
        }

        // 3. Fallback: If no client_id was passed, OR if the specific client query returned nothing
        if (empty($property)) {
            $property = $query->where('property_name', 'LIKE', 'Drippe Homes%') // Safe match for "Drippe Homes"
                ->first();
                
            // Absolute safety net: If for some reason "Drippe Homes" is missing/inactive, get the first available active record
            if (!$property) {
                $property = GoogleServiceProperty::where('service_type', 'ads')
                    ->where('is_active', 1)
                    ->first();
            }
        }

        if (!$property) {
            return response()->json(['error' => 'No active Google Ads property found.'], 404);
        }

    $customerId = $property->property_id; 
    $loginCustomerId = $property->metadata['mcc_id'] ?? null; // Adjust based on your DB schema



    // 2. Fetch and aggregate data for both ranges directly from the API
    $current = $this->fetchDirectMetricsFromApi($apiService, $account, $customerId, $loginCustomerId, $range['start'], $range['end'], $campaignIds);
    $previous = $this->fetchDirectMetricsFromApi($apiService, $account, $customerId, $loginCustomerId, $range['previousStart'], $range['previousEnd'], $campaignIds);



// dd($data);

    // 3. Performance Calculations
    $ctrCurrent = $current['impressions'] > 0 ? ($current['clicks'] / $current['impressions']) * 100 : 0;
    $ctrPrev    = $previous['impressions'] > 0 ? ($previous['clicks'] / $previous['impressions']) * 100 : 0;

    $cpcCurrent = $current['clicks'] > 0 ? ($current['cost'] / $current['clicks']) : 0;
    $cpcPrev    = $previous['clicks'] > 0 ? ($previous['cost'] / $previous['clicks']) : 0;

    $calcChange = function ($currentVal, $previousVal) {
        if ($previousVal == 0) return 0;
        return round((($currentVal - $previousVal) / $previousVal) * 100, 2);
    };

    // 4. Return formatted response
    return response()->json([
        'overview' => [
            'impressions'        => (int) $current['impressions'],
            'impressions_prev'   => (int) $previous['impressions'],
            'impressions_change' => $calcChange($current['impressions'], $previous['impressions']),

            'clicks'             => (int) $current['clicks'],
            'clicks_prev'        => (int) $previous['clicks'],
            'clicks_change'      => $calcChange($current['clicks'], $previous['clicks']),

            'cost'               => round($current['cost'], 2),
            'cost_prev'          => round($previous['cost'], 2),
            'cost_change'        => $calcChange($current['cost'], $previous['cost']),

            'conversions'        => (int) $current['conversions'],
            'conversions_prev'   => (int) $previous['conversions'],
            'conversions_change' => $calcChange($current['conversions'], $previous['conversions']),
             
            'ctr'                => round($ctrCurrent, 2),
            'ctr_prev'           => round($ctrPrev, 2),
            'ctr_change'         => $calcChange($ctrCurrent, $ctrPrev),

            'cpc'                => round($cpcCurrent, 2),
            'cpc_prev'           => round($cpcPrev, 2),
            'cpc_change'         => $calcChange($cpcCurrent, $cpcPrev),
        ]
    ]);
}

/**
 * Direct API extraction & compilation helper
 */
protected function fetchDirectMetricsFromApi($service, $account, $customerId, $loginCustomerId, $startDate, $endDate, array $campaignIds)
{
    // Initialize default collection array
    $totals = [
        'impressions' => 0,
        'clicks'      => 0,
        'conversions' => 0,
        'cost'        => 0.0
    ];

    if (empty($campaignIds)) {
        return $totals;
    }


    // $data = [$startDate, $endDate];
    // print_r($data);

 
            $where = "segments.date BETWEEN '{$startDate}' AND '{$endDate}'";

            $query = "
                SELECT
                    segments.date,
                    campaign.id,
                    metrics.impressions,
                    metrics.clicks,
                    metrics.conversions,
                    metrics.ctr,
                    metrics.average_cpc,
                    metrics.cost_micros
                FROM campaign
                WHERE {$where}
                LIMIT 10000
            ";

         $response = $service->query($account, $customerId, $query, $loginCustomerId);


    // // Filter by date range and restricted campaign scope
    // $campaignIdsString = implode(',', $campaignIds);
    // $query = "
    //     SELECT
    //         campaign.id,
    //         metrics.impressions,
    //         metrics.clicks,
    //         metrics.conversions,
    //         metrics.cost_micros
    //     FROM campaign
    //     WHERE segments.date BETWEEN '{$startDate}' AND '{$endDate}'
    //       AND campaign.id IN ({$campaignIdsString})
    //     LIMIT 10000
    // ";

    try {
       // $response = $service->query($account, $customerId, $query, $loginCustomerId);

        foreach ($response->iterateAllElements() as $row) {
            if (!$row->getMetrics()) continue;

            $metrics = $row->getMetrics();

            $totals['impressions'] += (int) $metrics->getImpressions();
            $totals['clicks']      += (int) $metrics->getClicks();
            $totals['conversions'] += (float) $metrics->getConversions();
            $totals['cost']        += ((float) $metrics->getCostMicros() / 1000000);
        }
    } catch (\Exception $e) {
        // Log error if needed: Log::error("Google Ads direct fetch failed: " . $e->getMessage());
        // Fallbacks back seamlessly to empty array schema metrics
    }

    return $totals;
}



public function campaigns(Request $request, GoogleAdsService $apiService)
{
    set_time_limit(180);
    $range = $this->resolveDateRange($request);

    $account = GoogleAccount::where('type', 'ads')->where('is_connected', true)->first();
     // 1. Initial Query: Start with base active 'ads' conditions
        $query = GoogleServiceProperty::where('service_type', 'ads')
            ->where('is_active', 1);

        // 2. Conditional Filter: If client_id is provided, look for that specific one first
        if (!empty($clientId)) {
            $property = (clone $query)->where('client_id', $clientId)->first();
        }

        // 3. Fallback: If no client_id was passed, OR if the specific client query returned nothing
        if (empty($property)) {
            $property = $query->where('property_name', 'LIKE', 'Drippe Homes%') // Safe match for "Drippe Homes"
                ->first();
                
            // Absolute safety net: If for some reason "Drippe Homes" is missing/inactive, get the first available active record
            if (!$property) {
                $property = GoogleServiceProperty::where('service_type', 'ads')
                    ->where('is_active', 1)
                    ->first();
            }
        }

        if (!$property) {
            return response()->json(['error' => 'No active Google Ads property found.'], 404);
        }

$loginCustomerId = $property->metadata['mcc_id'] ?? null;

    if (!$account || !$property) return response()->json(['error' => 'Config missing'], 404);

    $query = "
        SELECT
            campaign.id,
            campaign.name,
            campaign.advertising_channel_type,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros
        FROM campaign
        WHERE segments.date BETWEEN '{$range['start']}' AND '{$range['end']}'
    ";

    $campaigns = [];
    $response = $apiService->query($account, $property->property_id, $query, $loginCustomerId ?? null);



    foreach ($response->iterateAllElements() as $row) {
        $campaign = $row->getCampaign();
        $metrics = $row->getMetrics();

        $typeEnum = $campaign->getAdvertisingChannelType();
        $type = $typeEnum !== null ? \Google\Ads\GoogleAds\V22\Enums\AdvertisingChannelTypeEnum\AdvertisingChannelType::name($typeEnum) : 'UNKNOWN';

        $campaigns[] = [
            'campaign_id' => $campaign->getId(),
            'name'        => $campaign->getName(),
            'type'        => $type,
            'impressions' => (int) $metrics->getImpressions(),
            'clicks'      => (int) $metrics->getClicks(),
            'cost'        => round($metrics->getCostMicros() / 1000000, 2),
        ];
    }

    // Sort by impressions descending to match original behavior
    usort($campaigns, fn($a, $b) => $b['impressions'] <=> $a['impressions']);

    return response()->json($campaigns);
}

public function searchTerms(Request $request, GoogleAdsService $apiService)
{
    set_time_limit(180);
    $range = $this->resolveDateRange($request);

    $account = GoogleAccount::where('type', 'ads')->where('is_connected', true)->first();

        $query = GoogleServiceProperty::where('service_type', 'ads')
            ->where('is_active', 1);

        // 2. Conditional Filter: If client_id is provided, look for that specific one first
        if (!empty($clientId)) {
            $property = (clone $query)->where('client_id', $clientId)->first();
        }

        // 3. Fallback: If no client_id was passed, OR if the specific client query returned nothing
        if (empty($property)) {
            $property = $query->where('property_name', 'LIKE', 'Drippe Homes%') // Safe match for "Drippe Homes"
                ->first();
                
            // Absolute safety net: If for some reason "Drippe Homes" is missing/inactive, get the first available active record
            if (!$property) {
                $property = GoogleServiceProperty::where('service_type', 'ads')
                    ->where('is_active', 1)
                    ->first();
            }
        }

        if (!$property) {
            return response()->json(['error' => 'No active Google Ads property found.'], 404);
        }


    // 1. Log Configuration Checks
    if (!$account || !$property) {
        Log::error('Google Ads searchTerms Failed: Missing Account or Property configuration.', [
            'client_id' => $request->client_id
        ]);
        return response()->json(['error' => 'Configuration missing.'], 404);
    }

    $loginCustomerId = $property->metadata['mcc_id'] ?? null;

    // Log::info('Google Ads searchTerms Triggered', [
    //     'property_id' => $property->property_id,
    //     'mcc_id'      => $loginCustomerId,
    //     'start_date'  => $range['start'],
    //     'end_date'    => $range['end'],
    // ]);
   
    $query = "
        SELECT
            search_term_view.search_term,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros
        FROM search_term_view
        WHERE segments.date BETWEEN '{$range['start']}' AND '{$range['end']}'
          AND metrics.impressions > 0
        LIMIT 5000
    ";

    $searchTerms = [];

    // 2. Wrap API Call in Try-Catch to catch Google Ads Exceptions
    try {

        $response = $apiService->query($account, $property->property_id, $query, $loginCustomerId);

        foreach ($response->iterateAllElements() as $row) {
            $term = $row->getSearchTermView()->getSearchTerm();
            $metrics = $row->getMetrics();

            if (!isset($searchTerms[$term])) {
                $searchTerms[$term] = [
                    'search_term' => $term,
                    'impressions' => 0,
                    'clicks'      => 0,
                    'cost'        => 0.0,
                ];
            }

            $searchTerms[$term]['impressions'] += (int) $metrics->getImpressions();
            $searchTerms[$term]['clicks']      += (int) $metrics->getClicks();
            $searchTerms[$term]['cost']        += ($metrics->getCostMicros() / 1000000);
        }
        
    } catch (\Exception $e) {
        // 3. Log the exact API failure message
        // Log::error('Google Ads API Error in searchTerms', [
        //     'property_id' => $property->property_id,
        //     'error'       => $e->getMessage(),
        //     'trace'       => $e->getTraceAsString()
        // ]);
       
        return response()->json([
            'error'   => 'Failed to fetch data from Google Ads API.',
            'message' => $e->getMessage()
        ], 500);
    }

    $result = array_values($searchTerms);
    usort($result, fn($a, $b) => $b['impressions'] <=> $a['impressions']);

    foreach($result as &$r) {
        $r['cost'] = round($r['cost'], 2);
    }

    // // 4. Log successful completion
    // Log::info('Google Ads searchTerms Completed', [
    //     'property_id'  => $property->property_id,
    //     'total_results'=> count($result)
    // ]);

    return response()->json($result);
}

public function ads(Request $request, GoogleAdsService $apiService)
{
    set_time_limit(180);
    $range = $this->resolveDateRange($request);

    $account = GoogleAccount::where('type', 'ads')->where('is_connected', true)->first();
  $query = GoogleServiceProperty::where('service_type', 'ads')
            ->where('is_active', 1);

        // 2. Conditional Filter: If client_id is provided, look for that specific one first
        if (!empty($clientId)) {
            $property = (clone $query)->where('client_id', $clientId)->first();
        }

        // 3. Fallback: If no client_id was passed, OR if the specific client query returned nothing
        if (empty($property)) {
            $property = $query->where('property_name', 'LIKE', 'Drippe Homes%') // Safe match for "Drippe Homes"
                ->first();
                
            // Absolute safety net: If for some reason "Drippe Homes" is missing/inactive, get the first available active record
            if (!$property) {
                $property = GoogleServiceProperty::where('service_type', 'ads')
                    ->where('is_active', 1)
                    ->first();
            }
        }

        if (!$property) {
            return response()->json(['error' => 'No active Google Ads property found.'], 404);
        }

          $loginCustomerId = $property->metadata['mcc_id'] ?? null;
    $query = "
        SELECT
            campaign.name,
            campaign.advertising_channel_type,
            ad_group.name,
            ad_group_ad.ad.name,
            ad_group_ad.ad.type,
            ad_group_ad.ad.final_urls,
            ad_group_ad.ad.expanded_text_ad.headline_part1,
            ad_group_ad.ad.expanded_text_ad.description,
            ad_group_ad.ad.responsive_search_ad.headlines,
            ad_group_ad.ad.responsive_search_ad.descriptions,
            ad_group_ad.ad.image_ad.image_url,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros
        FROM ad_group_ad
        WHERE segments.date BETWEEN '{$range['start']}' AND '{$range['end']}'
        LIMIT 3000
    ";

    $response = $apiService->query($account, $property->property_id, $query, $loginCustomerId ?? null);
    $adsData = collect();

    foreach ($response->iterateAllElements() as $row) {
        if (!$row->getAdGroupAd()) continue;

        $ad = $row->getAdGroupAd()->getAd();
        $campaign = $row->getCampaign();
        
        $typeEnum = $campaign->getAdvertisingChannelType();
        $campaignType = $typeEnum !== null ? \Google\Ads\GoogleAds\V22\Enums\AdvertisingChannelTypeEnum\AdvertisingChannelType::name($typeEnum) : 'UNKNOWN';
        
        $campaignName = $campaign->getName();
        $adGroupName = $row->getAdGroup()->getName();
        $isRetargeting = str_contains(strtolower($campaignName), 'remarketing') || str_contains(strtolower($campaignName), 'retarget');

        $headline = null;
        if ($campaignType === 'SEARCH') {
            if ($ad->hasResponsiveSearchAd()) {
                $headline = collect($ad->getResponsiveSearchAd()->getHeadlines())->map(fn($h) => $h->getText())->implode(' | ');
            } elseif ($ad->hasExpandedTextAd()) {
                $headline = $ad->getExpandedTextAd()->getHeadlinePart1();
            }
        } elseif ($campaignType === 'DISPLAY') {
            $headline = $ad->getName() ?: $adGroupName;
        }

        $adsData->push([
            'ad_group_name'  => $adGroupName,
            'type'           => $campaignType,
            'is_retargeting' => $isRetargeting,
            'headline'       => $headline ?? $adGroupName,
            'final_url'      => $ad->getFinalUrls()[0] ?? null,
            'image_url'      => $ad->getImageAd()?->getImageUrl(),
            'impressions'    => (int) $row->getMetrics()->getImpressions(),
            'clicks'         => (int) $row->getMetrics()->getClicks(),
            'cost'           => $row->getMetrics()->getCostMicros() / 1000000,
        ]);
    }

    // 1. Group Ad Groups (SUM metrics by ad_group_name)
    $adGroups = $adsData->groupBy('ad_group_name')->map(function ($rows, $name) {
        return [
            'name'        => $name,
            'impressions' => $rows->sum('impressions'),
            'clicks'      => $rows->sum('clicks'),
            'cost'        => round($rows->sum('cost'), 2),
        ];
    })->sortByDesc('impressions')->values();

    // Formatter Closure for UI requirements
    $formatAds = function ($collection) {
        return $collection->sortByDesc('impressions')->map(function ($ad) {
            return [
                'headline'      => $ad['headline'],
                'ad_group_name' => $ad['ad_group_name'],
                'final_url'     => $ad['final_url'],
                'impressions'   => $ad['impressions'],
                'clicks'        => $ad['clicks'],
                'cost'          => round($ad['cost'], 2),
                'image_url'     => $ad['image_url'],
            ];
        })->values();
    };

    return response()->json([
        'ad_groups'       => $adGroups,
        'display_ads'     => $formatAds($adsData->where('type', 'DISPLAY')),
        'search_ads'      => $formatAds($adsData->where('type', 'SEARCH')),
        'retargeting_ads' => $formatAds($adsData->where('type', 'SEARCH')->where('is_retargeting', true)),
    ]);
}

    public function keywords(Request $request, GoogleAdsService $apiService)
    {
        set_time_limit(180);
        
        $clientId = $request->client_id;
        $groupId  = $request->group_id;

        $range = $this->resolveDateRange($request);
        $start = $range['start'];
        $end   = $range['end'];

        // 1. Fetch Google Account and Property Setup (following searchTerms pattern)
        $account = GoogleAccount::where('type', 'ads')->where('is_connected', true)->first();

        $queryBuilder = GoogleServiceProperty::where('service_type', 'ads')
            ->where('is_active', 1);

        // Conditional Filter: If client_id is provided, look for that specific one first
        if (!empty($clientId)) {
            $property = (clone $queryBuilder)->where('client_id', $clientId)->first();
        }

        // Fallback: If no client_id was passed, OR if the specific client query returned nothing
        if (empty($property)) {
            $property = $queryBuilder->where('property_name', 'LIKE', 'Drippe Homes%')->first();
                
            // Absolute safety net
            if (!$property) {
                $property = GoogleServiceProperty::where('service_type', 'ads')
                    ->where('is_active', 1)
                    ->first();
            }
        }

        // Configuration Check
        if (!$account || !$property) {
            Log::error('Google Ads keywords Failed: Missing Account or Property configuration.', [
                'client_id' => $clientId
            ]);
            return response()->json(['error' => 'Configuration missing.'], 404);
        }

        $loginCustomerId = $property->metadata['mcc_id'] ?? null;
        $campaignIds = $this->allowedPropertyIds($clientId, $groupId);

        Log::info('Google Ads keywords Triggered Live API Fetch', [
            'property_id' => $property->property_id,
            'mcc_id'      => $loginCustomerId,
            'start_date'  => $start,
            'end_date'    => $end,
        ]);

        // 2. Build the Google Ads Query (Filtering by Campaign IDs if available)
        $whereClause = "segments.date BETWEEN '{$start}' AND '{$end}'";
        // if (!empty($campaignIds)) {
        //     $campaignIdsString = implode(',', array_map('intval', $campaignIds));
        //     $whereClause .= " AND campaign.id IN ($campaignIdsString)";
        // }

        $apiQuery = "
            SELECT
                campaign.id,
                ad_group_criterion.keyword.text,
                metrics.impressions,
                metrics.clicks,
                metrics.cost_micros
            FROM keyword_view
            WHERE {$whereClause}
            AND metrics.impressions > 0
            LIMIT 5000
        ";

        $keywordsData = [];

        // 3. Live API Execution & Processing
        try {
            $response = $apiService->query($account, $property->property_id, $apiQuery, $loginCustomerId);

            foreach ($response->iterateAllElements() as $row) {
                if (!$row->getMetrics() || !$row->getAdGroupCriterion()) continue;

                $keywordText = $row->getAdGroupCriterion()->getKeyword()->getText();
                if (empty($keywordText)) continue;

                $metrics = $row->getMetrics();

                // Grouping and aggregating by keyword keyword text (Emulating MySQL's GROUP BY keyword)
                if (!isset($keywordsData[$keywordText])) {
                    $keywordsData[$keywordText] = [
                        'keyword'     => $keywordText,
                        'impressions' => 0,
                        'clicks'      => 0,
                        'cost'        => 0.0,
                    ];
                }

                $keywordsData[$keywordText]['impressions'] += (int) $metrics->getImpressions();
                $keywordsData[$keywordText]['clicks']      += (int) $metrics->getClicks();
                $keywordsData[$keywordText]['cost']        += ($metrics->getCostMicros() / 1000000);
            }
            
        } catch (\Exception $e) {
            Log::error('Google Ads API Error in keywords', [
                'property_id' => $property->property_id,
                'error'       => $e->getMessage()
            ]);
        
            return response()->json([
                'error'   => 'Failed to fetch data from Google Ads API.',
                'message' => $e->getMessage()
            ], 500);
        }

        // 4. Formatting and Sorting (Emulating MySQL's ORDER BY impressions DESC)
        $result = array_values($keywordsData);
        usort($result, fn($a, $b) => $b['impressions'] <=> $a['impressions']);

        foreach ($result as &$r) {
            $r['cost'] = round($r['cost'], 2);
        }

        Log::info('Google Ads keywords Live Fetch Completed', [
            'property_id'   => $property->property_id,
            'total_results' => count($result)
        ]);

        return response()->json($result);
    }

public function locations(Request $request, GoogleAdsService $apiService)
{
    set_time_limit(180);
    
    $clientId = $request->client_id;
    $groupId  = $request->group_id;

    $range = $this->resolveDateRange($request);
    $start = $range['start'];
    $end   = $range['end'];

    // 1. Fetch Google Account and Property Setup
    $account = GoogleAccount::where('type', 'ads')->where('is_connected', true)->first();

    $queryBuilder = GoogleServiceProperty::where('service_type', 'ads')
        ->where('is_active', 1);

    if (!empty($clientId)) {
        $property = (clone $queryBuilder)->where('client_id', $clientId)->first();
    }

    if (empty($property)) {
        $property = $queryBuilder->where('property_name', 'LIKE', 'Drippe Homes%')->first();
            
        if (!$property) {
            $property = GoogleServiceProperty::where('service_type', 'ads')
                ->where('is_active', 1)
                ->first();
        }
    }

    if (!$account || !$property) {
        Log::error('Google Ads locations Failed: Missing Account or Property configuration.', [
            'client_id' => $clientId
        ]);
        return response()->json(['error' => 'Configuration missing.'], 404);
    }

    $loginCustomerId = $property->metadata['mcc_id'] ?? null;
    $campaignIds = $this->allowedPropertyIds($clientId, $groupId);

    Log::info('Google Ads locations Triggered Live API Fetch', [
        'property_id' => $property->property_id,
        'mcc_id'      => $loginCustomerId,
        'start_date'  => $start,
        'end_date'    => $end,
    ]);

    // 2. Build the Geographic query
    $whereClause = "segments.date BETWEEN '{$start}' AND '{$end}'
                    AND metrics.impressions > 0
                    AND metrics.clicks > 0";

    // if (!empty($campaignIds)) {
    //     $campaignIdsString = implode(',', array_map('intval', $campaignIds));
    //     $whereClause .= " AND campaign.id IN ($campaignIdsString)";
    // }

    $apiQuery = "
        SELECT
            campaign.id,
            geographic_view.location_type,
            segments.geo_target_region,
            segments.geo_target_city,
            metrics.impressions,
            metrics.clicks,
            metrics.conversions
        FROM geographic_view
        WHERE {$whereClause}
        LIMIT 1000
    ";

    $rowsData = [];
    $geoIds = [];

    // 3. API Fetch & Processing (STEP 1: Collect IDs)
    try {
        $response = $apiService->query($account, $property->property_id, $apiQuery, $loginCustomerId);

        foreach ($response->iterateAllElements() as $row) {
            if (!$row->getSegments() || !$row->getMetrics() || !$row->getCampaign()) continue;

            $campaignId = $row->getCampaign()->getId();
            $cityId     = $row->getSegments()->getGeoTargetCity();
            $regionId   = $row->getSegments()->getGeoTargetRegion();

            $cityId   = $cityId ? str_replace('geoTargetConstants/', '', $cityId) : null;
            $regionId = $regionId ? str_replace('geoTargetConstants/', '', $regionId) : null;

            if ($cityId) $geoIds[] = $cityId;
            if ($regionId) $geoIds[] = $regionId;

            // Notice: your object outputs a numeric int or string representation for type
            $rowsData[] = [
                'campaign_id'  => $campaignId,
                'city_id'      => $cityId,
                'region_id'    => $regionId,
                'locationType' => $row->getGeographicView() ? $row->getGeographicView()->getLocationType() : null,
                'impressions'  => (int) $row->getMetrics()->getImpressions(),
                'clicks'       => (int) $row->getMetrics()->getClicks(),
                'conversions'  => (float) $row->getMetrics()->getConversions(),
            ];
        }

        // STEP 2: Fetch all geo names into $geoCache
        $geoCache = [];
        $geoIds = array_unique(array_filter($geoIds));

        if (!empty($geoIds)) {
            $idsString = implode(',', $geoIds);

            $geoQuery = "
                SELECT
                    geo_target_constant.id,
                    geo_target_constant.name
                FROM geo_target_constant
                WHERE geo_target_constant.id IN ({$idsString})
            ";

            $geoResponse = $apiService->query($account, $property->property_id, $geoQuery, $loginCustomerId);

            foreach ($geoResponse->iterateAllElements() as $geoRow) {
                $geo = $geoRow->getGeoTargetConstant();
                $geoCache[$geo->getId()] = $geo->getName();
            }
        }

        // STEP 3: Aggregate rows matching your original table design
        $totals = [];

        foreach ($rowsData as $row) {
            $cityStr   = $geoCache[$row['city_id']] ?? 'unknown';
            $regionStr = $geoCache[$row['region_id']] ?? 'unknown';

            // Safe parsing of the type string or fallback enum index
            $rawLocationType = $row['locationType'] !== null
                ? (is_numeric($row['locationType']) ? GeoTargetingType::name($row['locationType']) : (string)$row['locationType'])
                : 'UNKNOWN';

            // Precise grouping rules conversion
            if ($rawLocationType === 'AREA_OF_INTEREST' || $rawLocationType === 'DENSE_URBAN_AREA') {
                $locationType = 'City';
                $regionStr    = null; // Crucial: City lines don't show the Region string label
            } elseif ($rawLocationType === 'LOCATION_OF_PRESENCE') {
                $locationType = 'Region';
                $cityStr      = 'unknown'; // Crucial: Region lines hide granular cities under 'unknown'
            } else {
                // Transforms other targets seamlessly like "DMA_REGION" => "DMA Region"
                $locationType = ucwords(strtolower(str_replace('_', ' ', $rawLocationType)));
                $cityStr      = 'unknown';
            }

            // Create a compound identifier to group the rows correctly
            $key = "{$regionStr}_{$cityStr}_{$locationType}";

            if (!isset($totals[$key])) {
                $totals[$key] = [
                    'region'      => $regionStr,
                    'city'        => $cityStr,
                    'target_type' => $locationType,
                    'impressions' => 0,
                    'clicks'      => 0,
                    'conversions' => 0.0,
                ];
            }

            $totals[$key]['impressions'] += $row['impressions'];
            $totals[$key]['clicks']      += $row['clicks'];
            $totals[$key]['conversions'] += $row['conversions'];
        }
    } catch (\Exception $e) {
        Log::error('Google Ads API Error in locations', [
            'property_id' => $property->property_id,
            'error'       => $e->getMessage()
        ]);
       
        return response()->json([
            'error'   => 'Failed to fetch location data from Google Ads API.',
            'message' => $e->getMessage()
        ], 500);
    }

    // 4. Transform and Sort
    $result = array_values($totals);
    usort($result, fn($a, $b) => $b['impressions'] <=> $a['impressions']);

    foreach ($result as &$r) {
        $r['conversions'] = round($r['conversions'], 2);
    }

    return response()->json($result);
}

public function demographics(Request $request, GoogleAdsService $apiService)
{
    set_time_limit(180);
    
    $clientId = $request->client_id;
    $groupId  = $request->group_id;

    $range = $this->resolveDateRange($request);
    $start = $range['start'];
    $end   = $range['end'];

    // 1. Fetch Google Account and Property Setup (following searchTerms pattern)
    $account = GoogleAccount::where('type', 'ads')->where('is_connected', true)->first();

    $queryBuilder = GoogleServiceProperty::where('service_type', 'ads')
        ->where('is_active', 1);

    if (!empty($clientId)) {
        $property = (clone $queryBuilder)->where('client_id', $clientId)->first();
    }

    if (empty($property)) {
        $property = $queryBuilder->where('property_name', 'LIKE', 'Drippe Homes%')->first();
            
        if (!$property) {
            $property = GoogleServiceProperty::where('service_type', 'ads')
                ->where('is_active', 1)
                ->first();
        }
    }

    if (!$account || !$property) {
        Log::error('Google Ads demographics Failed: Missing Account or Property configuration.', [
            'client_id' => $clientId
        ]);
        return response()->json(['error' => 'Configuration missing.'], 404);
    }

    $loginCustomerId = $property->metadata['mcc_id'] ?? null;
    $campaignIds = $this->allowedPropertyIds($clientId, $groupId);

    // Build common filter string
   // $campaignIdsString = !empty($campaignIds) ? implode(',', array_map('intval', $campaignIds)) : null;
    $baseWhere = "segments.date BETWEEN '{$start}' AND '{$end}'";
    // if ($campaignIdsString) {
    //     $baseWhere .= " AND campaign.id IN ($campaignIdsString)";
    // }

    // Storage arrays for data grouping combinations
    $genderTotals = [];
    $ageTotals    = [];
    $deviceTotals = [];

    try {
        // ==========================================
        // QUERY 1: GENDER DATA FETCH
        // ==========================================
        $genderQuery = "
            SELECT
                ad_group_criterion.gender.type,
                metrics.impressions
            FROM gender_view
            WHERE {$baseWhere}
        ";
        $genderResponse = $apiService->query($account, $property->property_id, $genderQuery, $loginCustomerId);
        
        foreach ($genderResponse->iterateAllElements() as $row) {
            if (!$row->getAdGroupCriterion() || !$row->getMetrics()) continue;
            
            $genderEnum = $row->getAdGroupCriterion()->getGender()->getType();
            $genderVal  = $genderEnum !== null ? GenderType::name($genderEnum) : 'UNKNOWN';
            
            // Format to match database: conversion to lower case string key format
            $genderKey = strtolower($genderVal);
            
            if (!isset($genderTotals[$genderKey])) {
                $genderTotals[$genderKey] = 0;
            }
            $genderTotals[$genderKey] += (int) $row->getMetrics()->getImpressions();
        }

        // ==========================================
        // QUERY 2: AGE DATA FETCH
        // ==========================================
        $ageQuery = "
            SELECT
                ad_group_criterion.age_range.type,
                metrics.impressions
            FROM age_range_view
            WHERE {$baseWhere}
        ";
        $ageResponse = $apiService->query($account, $property->property_id, $ageQuery, $loginCustomerId);
        
        foreach ($ageResponse->iterateAllElements() as $row) {
            if (!$row->getAdGroupCriterion() || !$row->getMetrics()) continue;
            
            $ageEnum = $row->getAdGroupCriterion()->getAgeRange()->getType();
            // Use your local formatAge helper function if it exists, otherwise falls back to normal enum strings
            $ageVal  = method_exists($this, 'formatAge') ? $this->formatAge($ageEnum) : ($ageEnum !== null ? AgeRangeType::name($ageEnum) : 'UNKNOWN');
            
            if (!isset($ageTotals[$ageVal])) {
                $ageTotals[$ageVal] = 0;
            }
            $ageTotals[$ageVal] += (int) $row->getMetrics()->getImpressions();
        }

        // ==========================================
        // QUERY 3: DEVICE DATA FETCH
        // ==========================================
        $deviceQuery = "
            SELECT
                segments.device,
                metrics.impressions
            FROM campaign
            WHERE {$baseWhere}
        ";
        $deviceResponse = $apiService->query($account, $property->property_id, $deviceQuery, $loginCustomerId);
        
        foreach ($deviceResponse->iterateAllElements() as $row) {
            if (!$row->getSegments() || !$row->getMetrics()) continue;
            
            $deviceEnum = $row->getSegments()->getDevice();
            $deviceVal  = $deviceEnum !== null ? Device::name($deviceEnum) : 'UNKNOWN';
            
            $deviceKey = strtolower($deviceVal);
            
            if (!isset($deviceTotals[$deviceKey])) {
                $deviceTotals[$deviceKey] = 0;
            }
            $deviceTotals[$deviceKey] += (int) $row->getMetrics()->getImpressions();
        }



    } catch (\Exception $e) {
        Log::error('Google Ads API Error in demographics', [
            'property_id' => $property->property_id,
            'error'       => $e->getMessage()
        ]);
        return response()->json([
            'error'   => 'Failed to fetch live metrics data from Google Ads API.',
            'message' => $e->getMessage()
        ], 500);
    }

    // ==========================================
    // STEP 4: TRANSFORM OUTPUT FORMATS
    // ==========================================
    
    // 1. Structure Genders array -> 'name' => Capitalized, 'value' => aggregated impressions
    $genderOutput = [];
    foreach ($genderTotals as $name => $impressions) {
        $genderOutput[] = [
            'name'  => ucfirst($name),
            'value' => $impressions
        ];
    }

    // 2. Structure Ages array -> 'name' => Raw label format, 'value' => aggregated impressions
    $ageOutput = [];
    foreach ($ageTotals as $name => $impressions) {
        $ageOutput[] = [
            'name'  => $name,
            'value' => $impressions
        ];
    }

    // 3. Structure Devices array -> 'name' => Capitalized, 'value' => aggregated impressions
    $devicesOutput = [];
    foreach ($deviceTotals as $name => $impressions) {
        $devicesOutput[] = [
            'name'  => ucfirst($name),
            'value' => $impressions
        ];
    }

    // Return the clean consolidated array payload
    return response()->json([
        'gender'  => $genderOutput,
        'age'     => $ageOutput,
        'devices' => $devicesOutput,
    ]);
}


}