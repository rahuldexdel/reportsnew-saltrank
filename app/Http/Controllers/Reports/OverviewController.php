<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\SimplifiCampaign;
use Illuminate\Support\Facades\DB;
use App\Models\DataSource;

class OverviewController extends Controller
{
        public function overviewData(Request $request)
        {
            $callrail   = app(CallRailController::class);
            $googleads  = app(GoogleAdsController::class);

            $dates = app(\App\Http\Controllers\Reports\DashboardController::class)
                ->getDateRange($request->query('range', '7'));

            // ✅ Simpli.fi
            $simplifiTotals = $this->getSimplifiTotals($request);
            $simplifiDaily  = $this->getSimplifiDailyTimeseries($request);
            $total_results = $callrail->currentTimeseries($request)->getData(true);
          $totalCalls = $total_results['total_results']['total_calls'];


            $gadsOverview = $googleads->overview($request);
            $overviewdata = $gadsOverview->getData(true);

         
            $data = [
                'totals' => $simplifiTotals,

                // ✅ PLATFORM PERFORMANCE (NOW WITH GOOGLE ADS)
                'platformPerformance' => [
                    'simplifi' => [
                        'name'        => 'Simpli.fi',
                        'impressions' => $simplifiTotals['current']['impressions'] ?? 0,
                        'conversions' => $simplifiTotals['current']['walkIns'] ?? 0,
                        'calls'       => 0,
                        'spend'       => $this->getSimplifiSpend($request) ?? 0,
                    ],

                    'googleads' => [
                        'name'        => 'Google Ads',
                        'impressions' => $overviewdata['overview']['impressions'] ?? 0,
                        'conversions' => $overviewdata['overview']['conversions'] ?? 0,
                        'calls'       => $overviewdata['overview']['clicks'] ?? 0,
                        'spend'       => $overviewdata->cost ?? 0,
                    ],

                   'callraniking' => [
                        'name'        => 'Call Ranking',
                        'impressions' => $totalCalls ?? 0,
                        'conversions' => $totalCalls ?? 0,
                        'calls'       => $totalCalls ?? 0,
                        'spend'       => 0,
                    ],
                ],

                'simplifi' => [
                    'current' => $simplifiDaily
                ],

                'callrail' => [
                    'timeseries' => [
                        'current'  => $callrail->currentTimeseries($request)->getData(true),
                        'previous' => $callrail->previousTimeseries($request)->getData(true),
                    ],
                ],

                'googleads' => [
                    'overview' => $gadsOverview
                ],

                'range' => [
                    'currentStart' => $dates['currentStart'],
                    'currentEnd'   => $dates['currentEnd'],
                ],

                'dataSources' => DataSource::all(),
            ];

            return response()->json($data);
        }

        protected function getSimplifiSpend(Request $request): float
        {
            $dates = app(\App\Http\Controllers\Reports\DashboardController::class)
                ->getDateRange($request->query('range', '7'));

            return SimplifiCampaign::with([
                'stats' => fn ($q) => $q->whereBetween(
                    'stat_date',
                    [$dates['currentStart'], $dates['currentEnd']]
                )
            ])
            ->get()
            ->flatMap->stats
            ->sum('total_spend') ?? 0;
        }

        protected function getSimplifiDailyTimeseries(Request $request): array
        {
            $dates = app(\App\Http\Controllers\Reports\DashboardController::class)
                ->getDateRange($request->query('range', '7'));

            return DB::table('simplifi_campaign_stats')
                ->selectRaw('
                    stat_date as date,
                    SUM(impressions) as impressions,
                    SUM(clicks) as clicks,
                    SUM(weighted_actions) as walkIns,
                    SUM(total_spend) as spend
                ')
                ->whereBetween('stat_date', [
                    $dates['currentStart'],
                    $dates['currentEnd']
                ])
                ->groupBy('stat_date')
                ->orderBy('stat_date')
                ->get()
                ->keyBy('date')
                ->toArray();
        }



        protected function getSimplifiTotals(Request $request)
        {
            $user = app(\App\Http\Controllers\Reports\DashboardController::class)
                        ->get_user();
         //   $user_role = $user->user_role;
            $user_role = "Super Admin";
            $filterClientId = $request->query('client_id');
            $filterGroupId  = $request->query('group_id');
            // 🔹 Resolve clientIds
            if ($user_role === 'Super Admin') {
                if ($filterGroupId) {
                    $clientIds = DB::table('client_client_group')
                        ->where('client_group_id', $filterGroupId)
                        ->pluck('client_id')
                        ->toArray();
                } elseif ($filterClientId) {
                    $clientIds = [$filterClientId];
                } else {
                    $clientIds = [];
                }
            } elseif ($user_role === 'Agent') {
                $allowedClientIds = DB::table('client_client_group')
                    ->where('client_group_id', $user->client_Groups_id)
                    ->pluck('client_id')
                    ->toArray();

                if ($filterGroupId) {
                    $clientIds = DB::table('client_client_group')
                        ->where('client_group_id', $filterGroupId)
                        ->whereIn('client_id', $allowedClientIds)
                        ->pluck('client_id')
                        ->toArray();
                } elseif ($filterClientId && in_array($filterClientId, $allowedClientIds)) {
                    $clientIds = [$filterClientId];
                } else {
                    $clientIds = $allowedClientIds;
                }
            } else {
                $clientIds = [$user->client_id];
            }
            // 🔹 Date range
            $range = $request->query('range', '7');



            $dates = app(\App\Http\Controllers\Reports\DashboardController::class)
                            ->getDateRange($range);



            $currentStart  = $dates['currentStart'];
            $currentEnd    = $dates['currentEnd'];
            $previousStart = $dates['previousStart'];
            $previousEnd   = $dates['previousEnd'];

            $campaigns = SimplifiCampaign::with([
                'stats' => fn ($q) => $q->whereBetween('stat_date', [$currentStart, $currentEnd])
            ])
                ->when(!empty($clientIds), fn ($q) => $q->whereIn('client_id', $clientIds))
                ->whereHas('stats', fn ($q) => $q->whereBetween('stat_date', [$currentStart, $currentEnd]))
                ->get();
            $previousCampaigns = SimplifiCampaign::with([
                'stats' => fn ($q) => $q->whereBetween('stat_date', [$previousStart, $previousEnd])
            ])
                ->when(!empty($clientIds), fn ($q) => $q->whereIn('client_id', $clientIds))
                ->whereHas('stats', fn ($q) => $q->whereBetween('stat_date', [$previousStart, $previousEnd]))
                ->get();
            $totals = [
                'current'  => ['impressions' => 0, 'clicks' => 0, 'ctr' => 0, 'walkIns' => 0],
                'previous' => ['impressions' => 0, 'clicks' => 0, 'ctr' => 0, 'walkIns' => 0],
            ];

            foreach ($campaigns as $campaign) {
                foreach ($campaign->stats as $stat) {
                    $totals['current']['impressions'] += $stat->impressions ?? 0;
                    $totals['current']['clicks']      += $stat->clicks ?? 0;
                    $totals['current']['walkIns']     += $stat->weighted_actions ?? 0;
                }
            }
            $totals['current']['ctr'] =
                $totals['current']['impressions'] > 0
                    ? round($totals['current']['clicks'] / $totals['current']['impressions'], 6)
                    : 0;
            foreach ($previousCampaigns as $campaign) {
                foreach ($campaign->stats as $stat) {
                    $totals['previous']['impressions'] += $stat->impressions ?? 0;
                    $totals['previous']['clicks']      += $stat->clicks ?? 0;
                    $totals['previous']['walkIns']     += $stat->weighted_actions ?? 0;
                }
            }
            $totals['previous']['ctr'] =
                $totals['previous']['impressions'] > 0
                    ? round($totals['previous']['clicks'] / $totals['previous']['impressions'], 6)
                    : 0;
        
            return $totals;
        }

        public function aioverviewData(Request $request)
        {

 

            $callrail   = app(CallRailController::class);
            $googleads  = app(GoogleAdsController::class);
            $Ga4data    = app(\App\Http\Controllers\Api\Ga4DashboardController::class);

            // ✅ FIX: use explicit dates first
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');

            if ($startDate && $endDate) {
                $dates = [
                    'currentStart' => $startDate,
                    'currentEnd'   => $endDate,
                ];
            } else {
                $dates = app(\App\Http\Controllers\Reports\DashboardController::class)
                    ->getDateRange($request->query('range', '30'));
            }

            // ✅ IMPORTANT: force all controllers to use same dates
            $request->merge([
                'start_date' => $dates['currentStart'],
                'end_date'   => $dates['currentEnd'],
                'range' => "last_month",
            ]);


          
            $simplifiTotals = $this->getSimplifiTotals($request);
            $simplifiDaily  = $this->getSimplifiDailyTimeseries($request);

            $gadsOverview = $googleads->overview($request);
            $overviewdata = $gadsOverview->getData(true);

            $Ga4analyticsdata = $Ga4data->overview($request);
            $analyticsdata = $Ga4analyticsdata->getData(true);

            $data = [
                'totals' => $simplifiTotals,

                'platformPerformance' => [
                    'simplifi' => [
                        'name'        => 'Simpli.fi',
                        'impressions' => $simplifiTotals['current']['impressions'] ?? 0,
                        'conversions' => $simplifiTotals['current']['walkIns'] ?? 0,
                        'calls'       => 0,
                        'spend'       => $this->getSimplifiSpend($request) ?? 0,
                    ],

                    'googleads' => [
                        'name'        => 'Google Ads',
                        'impressions' => $overviewdata['overview']['impressions'] ?? 0,
                        'conversions' => $overviewdata['overview']['conversions'] ?? 0,
                        'calls'       => $overviewdata['overview']['clicks'] ?? 0,
                        'spend'       => $overviewdata->cost ?? 0,
                    ],
                ],

                'simplifi' => [
                    'current' => $simplifiDaily
                ],

                'googleanalytics' => [
                    'googleanalytics' => $analyticsdata
                ],

                'googleads' => [
                    'overview' => $gadsOverview
                ],

                'range' => [
                    'currentStart' => $dates['currentStart'],
                    'currentEnd'   => $dates['currentEnd'],
                ],

                'dataSources' => DataSource::all(),
            ];

            return response()->json($data);
        }


}
