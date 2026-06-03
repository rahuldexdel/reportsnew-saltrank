<?php


namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\GoogleAdsDailyMetric;
use App\Models\GoogleAdsCampaign;
use App\Models\GoogleAdsKeyword;
use App\Models\GoogleAdsSearchTerm;
use App\Models\GoogleAdsAd;
use App\Models\GoogleAdsDevice;
use App\Models\GoogleAdsLocation;
use App\Models\GoogleAdsDemographic;
use App\Models\GoogleAdsCall;
use App\Models\GoogleAdsCampaignMetric;




class GoogleAdsController extends Controller
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

            $dashboard = new DashboardController();
            $dates = $dashboard->getDateRange($range);


           // dd($dates);
            return [
                'start' => $dates['currentStart'],
                'end'   => $dates['currentEnd'],
                'previousStart' => $dates['previousStart'],
                'previousEnd' => $dates['previousEnd'],
            ];
        }


        public function overview(Request $request)
        {


            $clientId = $request->client_id;
            $groupId  = $request->group_id;

            $range = $this->resolveDateRange($request);
            $campaignIds = $this->allowedPropertyIds($clientId, $groupId);


            //dd($campaignIds);
            // CURRENT
            $current = GoogleAdsCampaignMetric::whereIn('campaign_id', $campaignIds)
                ->whereBetween('date', [$range['start'], $range['end']])
                ->selectRaw("
                    COALESCE(SUM(impressions),0) as impressions,
                    COALESCE(SUM(clicks),0) as clicks,
                    COALESCE(SUM(cost),0) as cost,
                    COALESCE(SUM(conversions),0) as conversions
                ")
                ->first();

            // PREVIOUS
            $previous = GoogleAdsCampaignMetric::whereIn('campaign_id', $campaignIds)
                ->whereBetween('date', [$range['previousStart'], $range['previousEnd']])
                ->selectRaw("
                    COALESCE(SUM(impressions),0) as impressions,
                    COALESCE(SUM(clicks),0) as clicks,
                    COALESCE(SUM(cost),0) as cost,
                    COALESCE(SUM(conversions),0) as conversions
                ")
                ->first();


               
            // ✅ Calculations
            $ctrCurrent = $current->impressions > 0
                ? ($current->clicks / $current->impressions) * 100 : 0;

            $ctrPrev = $previous->impressions > 0
                ? ($previous->clicks / $previous->impressions) * 100 : 0;

            $cpcCurrent = $current->clicks > 0
                ? ($current->cost / $current->clicks) : 0;

            $cpcPrev = $previous->clicks > 0
                ? ($previous->cost / $previous->clicks) : 0;

            $calcChange = function ($current, $previous) {
                if ($previous == 0) return 0;
                return round((($current - $previous) / $previous) * 100, 2);
            };

            return response()->json([
                'overview' => [
                    'impressions' => (int) $current->impressions,
                    'impressions_prev' => (int) $previous->impressions,
                    'impressions_change' => $calcChange($current->impressions, $previous->impressions),

                    'clicks' => (int) $current->clicks,
                    'clicks_prev' => (int) $previous->clicks,
                    'clicks_change' => $calcChange($current->clicks, $previous->clicks),

                    'cost' => (float) $current->cost,
                    'cost_prev' => (float) $previous->cost,
                    'cost_change' => $calcChange($current->cost, $previous->cost),

                // ✅ ADD THIS
                    'conversions' => (int) $current->conversions,
                    'conversions_prev' => (int) $previous->conversions,
                    'conversions_change' => $calcChange($current->conversions, $previous->conversions),
                     
                    'ctr' => round($ctrCurrent, 2),
                    'ctr_prev' => round($ctrPrev, 2),
                    'ctr_change' => $calcChange($ctrCurrent, $ctrPrev),

                    'cpc' => round($cpcCurrent, 2),
                    'cpc_prev' => round($cpcPrev, 2),
                    'cpc_change' => $calcChange($cpcCurrent, $cpcPrev),
                ]
            ]);
        }


        public function timeseries(Request $request)
        {
            $clientId = $request->client_id;
            $groupId  = $request->group_id;

            $range = $this->resolveDateRange($request);
            $start = $range['start'];
            $end   = $range['end'];

            $campaignIds = $this->allowedPropertyIds($clientId, $groupId);

            return GoogleAdsCampaignMetric::whereIn('campaign_id', $campaignIds)
                ->whereBetween('date', [$start, $end])
                ->orderBy('date')
                ->get([
                    'date',
                    'impressions',
                    'clicks',
                    'cost'
                ]);
        }


        public function campaigns(Request $request)
        {
            $clientId = $request->client_id;
            $groupId  = $request->group_id;

            $range = $this->resolveDateRange($request);
            $start = $range['start'];
            $end   = $range['end'];

            $campaignIds = $this->allowedPropertyIds($clientId, $groupId);

        return GoogleAdsCampaign::with(['metrics' => function ($query) use ($start, $end) {
                $query->whereBetween('date', [$start, $end]);
            }])
            ->whereIn('campaign_id', $campaignIds)
            ->get()
            ->map(function ($campaign) {
                return [
                    'campaign_id' => $campaign->campaign_id,
                    'name' => $campaign->name,
                    'type' => $campaign->type,
                    'impressions' => $campaign->metrics->sum('impressions'),
                    'clicks' => $campaign->metrics->sum('clicks'),
                    'cost' => $campaign->metrics->sum('cost'),
                ];
            })
            ->sortByDesc('impressions')
            ->values();
        }


         public function keywords(Request $request)
        {
            $clientId = $request->client_id;
            $groupId  = $request->group_id;

            $range = $this->resolveDateRange($request);
            $start = $range['start'];
            $end   = $range['end'];

            $campaignIds = $this->allowedPropertyIds($clientId, $groupId);

            return GoogleAdsKeyword::whereIn('campaign_id', $campaignIds)
                ->whereBetween('date', [$start, $end])
                ->selectRaw("
                    keyword,
                    SUM(impressions) as impressions,
                    SUM(clicks) as clicks,
                    SUM(cost) as cost
                ")
                ->groupBy('keyword')
                ->orderByDesc('impressions')
                ->get();
        }

        public function searchTerms(Request $request)
        {
            $clientId = $request->client_id;
            $groupId  = $request->group_id;

            $range = $this->resolveDateRange($request);
            $start = $range['start'];
            $end   = $range['end'];

            $campaignIds = $this->allowedPropertyIds($clientId, $groupId);

            return GoogleAdsSearchTerm::whereIn('campaign_id', $campaignIds)
                ->whereBetween('date', [$start, $end])
                ->selectRaw("
                    search_term,
                    SUM(impressions) as impressions,
                    SUM(clicks) as clicks,
                    SUM(cost) as cost
                ")
                ->groupBy('search_term')
                ->orderByDesc('impressions')
                ->get();
        }

       public function ads(Request $request)
        {
            $clientId = $request->client_id;    
            $groupId  = $request->group_id;

            $range = $this->resolveDateRange($request);
            $start = $range['start'];
            $end   = $range['end'];

            $campaignIds = $this->allowedPropertyIds($clientId, $groupId);

            $ads = GoogleAdsAd::whereIn('campaign_id', $campaignIds)
                ->whereBetween('date', [$start, $end])
                ->get();

            // 🔹 AD GROUP PERFORMANCE (ALREADY CORRECT)
            $adGroups = $ads->groupBy('ad_group_name')->map(function ($rows) {

                $impressions = $rows->sum('impressions');
                $clicks = $rows->sum('clicks');
                $cost = $rows->sum('cost');

                return [
                    'name' => $rows->first()->ad_group_name,
                    'impressions' => $impressions,
                    'clicks' => $clicks,
                    'cost' => $cost,
                ];
            })->sortByDesc('impressions')->values();

            // 🔥 FORMAT ADS (IMPORTANT)
            $formatAds = function ($collection) {
                return $collection
                    ->sortByDesc('impressions') // 🔥 IMPORTANT (your UI heatmap depends on this)
                    ->map(function ($ad) {


                     // dd($ad->headline, $ad->ad_group_name);
                        return [
                            'headline' => $ad->headline ?? $ad->ad_group_name,
                            'ad_group_name' => $ad->ad_group_name,
                            'final_url' => $ad->final_url,
                            'impressions' => (int) $ad->impressions,
                            'clicks' => (int) $ad->clicks,
                            'cost' => (float) $ad->cost,
                            'image_url' => $ad->image_url,
                            'ad_preview' => $ad->ad_preview_url ?? null,
                        ];
                    })
                    ->values();
            };

           

            return response()->json([

                // ✅ AD GROUP TABLE
                'ad_groups' => $adGroups,

                // ✅ DISPLAY ADS TABLE
                'display_ads' => $formatAds(
                    $ads->where('type', 'DISPLAY')
                ),

                // ✅ SEARCH ADS TABLE
                'search_ads' => $formatAds(
                    $ads->where('type', 'SEARCH')
                ),

                // ✅ RETARGETING TABLE
                'retargeting_ads' => $formatAds(
                    $ads->where('type', 'SEARCH')->where('is_retargeting', 1)
                ),
            ]);
        }

        public function locations(Request $request)
        {
            $clientId = $request->client_id;
            $groupId  = $request->group_id;

            $range = $this->resolveDateRange($request);
            $start = $range['start'];
            $end   = $range['end'];

            $campaignIds = $this->allowedPropertyIds($clientId, $groupId);



            return GoogleAdsLocation::whereIn('campaign_id', $campaignIds)
                    ->whereBetween('date', [$start, $end])
                    ->selectRaw("
                        region,
                        city,
                        target_type, 
                        SUM(impressions) as impressions,
                        SUM(clicks) as clicks,
                        SUM(conversions) as conversions
                    ")
                    ->groupBy('region', 'city', 'target_type') // ✅ FIX
                    ->orderByDesc('impressions')
                    ->get();
              
        }
    
        public function demographics(Request $request)
        {
            $clientId = $request->client_id;
            $groupId  = $request->group_id;

            $range = $this->resolveDateRange($request);
            $start = $range['start'];
            $end   = $range['end'];

            $campaignIds = $this->allowedPropertyIds($clientId, $groupId);

            // 🔹 DEMOGRAPHICS
            $data = GoogleAdsDemographic::whereIn('campaign_id', $campaignIds)
                ->whereBetween('date', [$start, $end])
                ->selectRaw("
                    type,
                    value,
                    SUM(impressions) as impressions,
                    SUM(clicks) as clicks
                ")
                ->groupBy('type', 'value')
                ->get();

            $gender = [];
            $age = [];

            foreach ($data as $row) {

                if ($row->type === 'gender') {
                    $gender[] = [
                        'name' => ucfirst(strtolower($row->value)),
                        'value' => (int) $row->impressions,
                    ];
                }

                if ($row->type === 'age') {
                    $age[] = [
                        'name' => $row->value,
                        'value' => (int) $row->impressions,
                    ];
                }
            }

            // 🔹 DEVICES (IMPORTANT FIX: added account filter)
            $devices = \App\Models\GoogleAdsCampaignDeviceMetric::whereIn('campaign_id', $campaignIds)
                ->whereBetween('date', [$start, $end])
                ->selectRaw("
                    device,
                    SUM(impressions) as impressions
                ")
                ->groupBy('device')
                ->get()
                ->map(fn($d) => [
                    'name' => ucfirst(strtolower($d->device)),
                    'value' => (int) $d->impressions
                ]);

            return response()->json([
                'gender' => $gender,
                'age' => $age,
                'devices' => $devices,
            ]);
        }

       public function calls(Request $request)
        {
            $clientId = $request->client_id;
            $groupId  = $request->group_id;

            $range = $this->resolveDateRange($request);
            $start = $range['start'];
            $end   = $range['end'];

            $campaignIds = $this->allowedPropertyIds($clientId, $groupId);

            return response()->json([
                'data' => GoogleAdsCall::whereIn('campaign_id', $campaignIds)
                    ->whereBetween('date', [$start, $end])
                    ->orderBy('date', 'desc')
                    ->get([
                        'date',
                        'total_calls'
                    ])
            ]);
        }
}