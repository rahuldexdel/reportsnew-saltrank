<?php

namespace App\Http\Controllers\Reports;

use App\Models\DataSource;
use App\Models\SimplifiOrganizations;
use App\Models\GoogleAccount;
use App\Services\SimplifiApiService;
use App\Models\SearchConsoleData;
use App\Services\SearchConsoleService;
use App\Services\GoogleTokenService;
use App\Services\GoogleAuthService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Models\SimpliFiReport;
use App\Models\SimplifiCampaign;
use App\Models\SimplifiCampaignStat;
use App\Models\Client;
use App\Models\SimplifiCampaignAd;
use App\Models\GoogleServiceProperty;
use App\Models\SemrushClientAssignment;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use App\Models\SimplifiAdStat;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Reports\SlowApiController; 
use App\Services\SemrushService;
use App\Models\Site;
use App\Models\ClientGroup;
use App\Models\Dashboard;
use App\Jobs\GenerateAIInsightsJob;



class DashboardController extends Controller
{
    private SimplifiApiService $simplifiApiService;
    private SearchConsoleService $searchConsoleService;
    private GoogleTokenService $googleTokenService;
    protected GoogleAuthService $googleAuthService;
    protected SemrushService $semrushService;

    public function __construct()
    {
        $this->simplifiApiService = app(SimplifiApiService::class);
        $this->searchConsoleService = app(SearchConsoleService::class);
        $this->googleTokenService = app(GoogleTokenService::class);
         $this->googleAuthService = app(GoogleAuthService::class);
         $this->semrushService = app(SemrushService::class);
    }


               public function simplifiSummary(Request $request)
                {
                    $id = trim($request->input('id'));

                    if (!$id) {
                        return response()->json([
                            'status' => false,
                            'message' => 'ID is required'
                        ], 400);
                    }

                    // 1️⃣ CHECK IF ORGANIZATION EXISTS
                    $organization = SimplifiOrganizations::with(['campaigns.stats'])
                        ->where('organization_id', $id)
                        ->first();

                    if ($organization) {
                        // Get all campaigns under this org
                        $campaigns = $organization->campaigns;

                        // Collect all stats from all campaigns
                        $allStats = $campaigns->flatMap(function ($campaign) {
                            return $campaign->stats;
                        });

                        return response()->json([
                            'type' => 'organization',
                            'organization_id' => $organization->organization_id,
                            'organization_name' => $organization->name,

                            'total_campaigns' => $campaigns->count(),

                            // Aggregated stats
                            'total_impressions' => $allStats->sum('impressions'),
                            'total_clicks' => $allStats->sum('clicks'),
                            'total_walkins' => $allStats->sum('weighted_actions'),

                            // Send list of campaigns with stats
                            'campaigns' => $campaigns->map(function ($c) {
                                return [
                                    'campaign_id' => $c->campaign_id,
                                    'campaign_name' => $c->campaign_name,
                                    'total_impressions' => $c->stats->sum('impressions'),
                                    'total_clicks' => $c->stats->sum('clicks'),
                                    'total_walkins' => $c->stats->sum('weighted_actions'),
                                    'daily_stats' => $c->stats,
                                ];
                            })
                        ]);
                    }

                    // 2️⃣ CHECK IF CAMPAIGN EXISTS
                    $campaign = SimplifiCampaign::with('stats')
                        ->where('campaign_id', $id)
                        ->first();

                    if ($campaign) {
                        return response()->json([
                            'type' => 'campaign',
                            'campaign_id' => $campaign->campaign_id,
                            'campaign_name' => $campaign->campaign_name,

                            'total_impressions' => $campaign->stats->sum('impressions'),
                            'total_clicks' => $campaign->stats->sum('clicks'),
                            'total_walkins' => $campaign->stats->sum('weighted_actions'),

                            'daily_stats' => $campaign->stats,
                        ]);
                    }

                    // 3️⃣ NO MATCH FOUND
                    return response()->json([
                        'status' => false,
                        'message' => 'No matching organization or campaign found',
                    ]);
                }

            public function index(Request $request)
            {
                        $user = auth()->user();
                        $dashboardId = $request->get('dashboard_id');
                        $dashboard = null;
                        if ($dashboardId) {
                            $dashboard = Dashboard::find($dashboardId);
                        }

                        $clientName = null;
                        $groupName = null;

                        if (!empty($dashboard->client_id)) {
                            $client = Client::find($dashboard->client_id);
                            $clientName = $client?->company_name;
                        }

                        if (!empty($dashboard->client_group_id)) {
                            $group = ClientGroup::find($dashboard->client_group_id);
                            $groupName = $group?->name;
                        }

                        $clients = [];
                        $clientIds = [];
                        if (!empty($user->client_id)) {
                            $clientIds = [$user->client_id];
                        }
                        elseif (!empty($user->client_Groups_id)) {
                            $clientIds = DB::table('client_client_group')
                                ->where('client_group_id', $user->client_Groups_id)
                                ->pluck('client_id')
                                ->toArray();
                        }
                     //   dd($clientIds);
                        $googleServices = GoogleServiceProperty::whereIn('client_id', $clientIds)
                        ->where('is_assigned', true)
                        ->where('is_active', true)
                        ->pluck('service_type')
                        ->unique();
                        $serviceAccess['analytics']      = $googleServices->contains('analytics');

                        $serviceAccess['semrush'] = Site::whereIn('client_id', $clientIds)
                                                    ->exists();

                        $serviceAccess['simplifi'] =   SimplifiOrganizations::whereIn('client_id', $clientIds)
                                                    ->where('is_assigned', true)
                                                    ->exists()
                                                ||
                                                SimplifiCampaign::whereIn('client_id', $clientIds)
                                                    ->where('is_assigned', true)
                                                    ->exists();
                       $serviceAccess['call-tracking'] = DB::table('client_call_tracking_accounts')
                                                        ->whereIn('client_id', $clientIds)
                                                        ->exists();
                        $dataSources = DataSource::where(function ($q) use ($serviceAccess) {
                                foreach ($serviceAccess as $service => $enabled) {
                                    if ($enabled) {
                                        $q->orWhere('service', $service);
                                    }
                                }
                            })->get();
                        $clientGroups = [];
                        if ($user->user_role === 'Super Admin') {
                        $clients = Client::select('id', 'company_name')->get();
                        $clientGroups = ClientGroup::select('id', 'name')->get();

                        } elseif ($user->user_role === 'Agent') {
                            $clientGroups = ClientGroup::select('id', 'name')
                                ->where('id', $user->client_Groups_id)
                                ->get();
                            $clients = Client::select('id', 'company_name')
                                ->whereHas('groups', function ($q) use ($user) {
                                    $q->where('client_group_id', $user->client_Groups_id);
                                })
                                ->get();
                        } else{
                              $clients = [];
                              $clientGroups = [];
                        }
                        return Inertia::render('Reports/Dashboard', [
                            'dashboard' => $dashboard,
                            'clientName' => $clientName,
                            'groupName' => $groupName,
                            'dataSources'   => $dataSources,
                            'clients'      => $clients,
                            'clientGroups' => $clientGroups,
                            'userRole' => $user->user_role,
                            'profile_type' => $user->data_profile,
                        ]);

            }



            public function webhook(Request $request)
            {
                Log::info('Simpli.fi Webhook received:', $request->all());
                $data = $request->all();
                if (!isset($data['download_link']) || !isset($data['report_id'])) {
                    Log::error('Missing data in Simpli.fi webhook');
                    return response()->json(['status' => 'error', 'message' => 'Invalid data'], 400);
                }
                try {
                    $response = Http::get($data['download_link']);
                    if ($response->successful()) {
                        $reportData = $response->json();
                        $filename = $data['report_filename'] ?? 'simpli_report_' . time() . '.json';
                        $filePath = 'reports/' . $filename;
                        Storage::disk('local')->put($filePath, json_encode($reportData));
                        SimpliFiReport::create([
                            'report_id'      => $data['report_id'],
                            'schedule_id'    => $data['schedule_id'],
                            'filename'       => $filename,
                            'report_data'    => $filename, 
                            'download_url'   => $data['download_link'],
                            'file_path'      => $filePath, 
                            'received_at'    => now(),
                        ]);
                        return response()->json([
                            'status' => 'success',
                            'message' => 'Report data saved successfully.'
                        ]);
                    } else {
                        Log::error('Failed to download Simpli.fi report: ' . $response->status());
                        return response()->json(['status' => 'error', 'message' => 'Failed to download report'], 500);
                    }
                } catch (\Exception $e) {
                    Log::error('Exception in Simpli.fi Webhook: ' . $e->getMessage());
                    return response()->json(['status' => 'error', 'message' => 'Exception occurred'], 500);
                }
            }

            public function overviewData()
            {
                return response()->json([
                    'stats' => [
                        'users' => 120,
                        'sales' => 230,
                        'visits' => 550,
                    ]
                ]);
            }
                 
        
            public function simplifiData(Request $request)
            {
                try {
                    $user = $this->get_user();     
                    $user_role = $user->user_role;
                    $filterClientId = $request->query('client_id');
                    $filterGroupId  = $request->query('group_id');
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
                        } elseif ($filterClientId) {
                            if (in_array($filterClientId, $allowedClientIds)) {
                                $clientIds = [$filterClientId];
                            } else {
                                $clientIds = [];
                            }
                        } else {
                            $clientIds = $allowedClientIds;
                        }
                    } else {
                        if ($filterClientId && $filterClientId == $user->client_id) {
                            $clientIds = [$user->client_id];
                        } else {
                            $clientIds = [$user->client_id];
                        }
                    }

                    // dd($clientIds);

                    //    if ($filterGroupId && empty($clientIds)) {
                    //             return response()->json([
                    //                 'data' => [],
                    //                 'message' => 'No accessible clients for this group'
                    //             ]);
                    //         }


                    $orgs =  SimplifiCampaign::select('organization_id')->when(!empty($clientIds), function ($q) use ($clientIds) {
                        return $q->whereIn('client_id', $clientIds);
                    })->distinct()->pluck('organization_id')->toArray();

    
                    

                    // $total = SimplifiCampaignStat::when(!empty($orgs), function ($q) use ($orgs) {
                    //             return $q->whereIn('org_id', $orgs);
                    //         })->sum('impressions');
                    $range = $request->query('range', '7');
                    $dates = $this->getDateRange($range);
                    $total = SimplifiCampaignStat::whereIn('org_id', $orgs)
                                ->where('stat_date', '>=', $dates['currentStart'])
                                ->where('stat_date', '<=', $dates['currentEnd'])
                                ->sum('impressions');
                    $alldata = SimplifiCampaign::select('client_id', 'organization_id', 'campaign_id')
                        ->when(!empty($clientIds), function ($q) use ($clientIds) {
                            return $q->whereIn('client_id', $clientIds);
                        })
                        ->get()
                        ->toArray();
                    $organizationIds = collect($alldata)
                        ->pluck('organization_id')
                        ->unique()
                        ->toArray();
                    $organizations = SimplifiOrganizations::with('account')
                        ->when(!empty($organizationIds), function ($q) use ($organizationIds) {
                            return $q->whereIn('organization_id', $organizationIds);
                        })
                        ->get();       
                    $range = $request->query('range', '7');
                    $dates = $this->getDateRange($range);
                    $currentStart  = $dates['currentStart'];
                    $currentEnd    = $dates['currentEnd'];
                    $previousStart = $dates['previousStart'];
                    $previousEnd   = $dates['previousEnd'];
                    // if (!$latestReport) {
                    //     return response()->json(['error' => 'No report found'], 404);
                    // }
                    // $downloadUrl = $latestReport->download_url;

                    $downloadUrl = "https://app.simpli.fi/report_center/reports/2332113/schedules/3808566/download?code=e827c07c3a37763b877b1b05bd631eaed47bc11d";                   
                    $response = Http::get($downloadUrl);
                    $campaign_performance = [];
                    if ($response->successful()) {
                        $campaign_performance = collect($response->json())
                            ->filter(function ($item) use ($currentStart, $currentEnd) {
                                $eventDate = $item['fact_geo_fence_users.event_date'] ?? null;
                                return $eventDate && ($eventDate >= $currentStart && $eventDate <= $currentEnd);
                            })
                            ->values()
                            ->toArray();
                    }  
                    $campaigns = SimplifiCampaign::with([
                        'stats' => function ($q) use ($currentStart, $currentEnd) {
                            $q->whereBetween('stat_date', [$currentStart, $currentEnd]);
                        }
                    ])
                        ->when(!empty($clientIds), function ($q) use ($clientIds) {
                            return $q->whereIn('client_id', $clientIds);
                        })
                        ->whereHas('stats', function ($q) use ($currentStart, $currentEnd) {
                            $q->whereBetween('stat_date', [$currentStart, $currentEnd]);
                        })
                        ->get();
                    $previousCampaigns = SimplifiCampaign::with([
                        'stats' => function ($q) use ($previousStart, $previousEnd) {
                            $q->whereBetween('stat_date', [$previousStart, $previousEnd]);
                        }
                    ])
                        ->when(!empty($clientIds), function ($q) use ($clientIds) {
                            return $q->whereIn('client_id', $clientIds);
                        })
                        ->whereHas('stats', function ($q) use ($previousStart, $previousEnd) {
                            $q->whereBetween('stat_date', [$previousStart, $previousEnd]);
                        })
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
                    $campaignsWithStats = [];
                    foreach ($campaigns as $campaign) {
                        $dailyStats = [];
                        foreach ($campaign->stats as $stat) {
                            $impressions = $stat->impressions ?? 0;
                            $clicks      = $stat->clicks ?? 0;
                            $walkIns     = $stat->weighted_actions ?? 0;
                            $ctr = $impressions > 0 ? round($clicks / $impressions, 6) : 0;
                            $dailyStats[] = [
                                'stat_date'   => $stat->stat_date->format('Y-m-d'),
                                'impressions' => $impressions,
                                'clicks'      => $clicks,
                                'ctr'         => $ctr,
                                'walk_ins'    => $walkIns,
                                'geofence'    => $stat->geofence,
                            ];
                        }
                        $campaignsWithStats[] = [
                            'campaign_id'   => $campaign->campaign_id,
                            'campaign_name' => $campaign->campaign_name,
                            'stats'         => $dailyStats,
                        ];
                    }
                    $previousstats = [];
                    foreach ($previousCampaigns as $campaign) {
                        $dailyStats = [];
                        foreach ($campaign->stats as $stat) {
                            $impressions = $stat->impressions ?? 0;
                            $clicks      = $stat->clicks ?? 0;
                            $walkIns     = $stat->weighted_actions ?? 0;

                            $ctr = $impressions > 0 ? round($clicks / $impressions, 6) : 0;

                            $dailyStats[] = [
                                'stat_date'   => $stat->stat_date->format('Y-m-d'),
                                'impressions' => $impressions,
                                'clicks'      => $clicks,
                                'ctr'         => $ctr,
                                'walk_ins'    => $walkIns,
                                'geofence'    => $stat->geofence,
                            ];
                        }
                        $previousstats[] = [
                            'campaign_id'   => $campaign->campaign_id,
                            'campaign_name' => $campaign->campaign_name,
                            'stats'         => $dailyStats,
                        ];
                    }             
                    $allCampaigns = [];
                    foreach ($organizations as $org) {
                        $org_id = $org->organization_id;
                        if (!$org_id) {
                            continue;
                        }
                        try {
                            $rows = DB::table('campaign_daily_stats')
                                ->where('organization_id', $org_id)
                                ->whereBetween('stat_date', [$currentStart, $currentEnd])
                                ->get();
                            if ($rows->isEmpty()) {
                                continue;
                            }
                            $campaignss = [];
                            foreach ($rows->groupBy('campaign_id') as $campaignId => $campaignRows) {

                                $firstCampaignRow = $campaignRows->first();

                                $ads = [];
                                foreach ($campaignRows->groupBy('ad_id') as $adId => $adRows) {

                                    $firstAdRow = $adRows->first();

                                    $ads[] = [
                                        'ad_id'                => $adId,
                                        'ad_name'              => $firstAdRow->ad_name,
                                        'impressions'          => $adRows->sum('impressions'),
                                        'clicks'               => $adRows->sum('clicks'),
                                        'ctr'                  => round($adRows->avg('ctr'), 2),
                                        'total_spend'          => $adRows->sum('total_spend'),
                                        'primary_creative_url' => $firstAdRow->primary_creative_url,
                                        'target_url'           => $firstAdRow->target_url,
                                    ];
                                }
                                $campaignss[] = [
                                    'campaign_id'   => $campaignId,
                                    'campaign_name' => $firstCampaignRow->campaign_name,
                                    'geofence'      => json_decode($firstCampaignRow->geofence, true),

                                    // 'impressions'   => $campaignRows->sum('impressions'),
                                    // 'clicks'        => $campaignRows->sum('clicks'),
                                    // 'ctr'           => round($campaignRows->avg('ctr'), 2),
                                    // 'total_spend'   => $campaignRows->sum('total_spend'),

                                    'ads_merged'    => $ads,
                                ];
                            }
                            $allCampaigns[] = [
                                'organization_id' => $org_id,
                                'campaigns'       => $campaignss,
                            ];

                        } catch (\Throwable $e) {

                            \Log::error('DB Campaign Fetch Error', [
                                'org_id' => $org_id,
                                'error'  => $e->getMessage(),
                            ]);
                        }
                    }
                    $validCampaignIds = collect($alldata)
                        ->pluck('campaign_id')
                        ->unique()
                        ->toArray();
                    $allCampaigns1 = collect($allCampaigns)
                        ->map(function ($org) use ($user_role, $validCampaignIds) {

                            if ($user_role === 'Super Admin') {
                                return $org;
                            }
                            $org['campaigns'] = collect($org['campaigns'])
                                ->filter(fn ($c) => in_array($c['campaign_id'], $validCampaignIds))
                                ->values()
                                ->toArray();

                            return $org;
                        })
                        ->toArray();
                    $ids = [];
                    foreach ($campaigns as $campaign) {
                        $ids[] = [
                            'organization_id' => $campaign->organization_id,
                            'campaign_id' => $campaign->campaign_id,
                        ];
                    }
                    $filteredPerformance = [];
                    foreach ($campaign_performance as $item) {
                        $companyId  = $item['dim_client.client_id'] ?? null;
                        $campaignId = $item['dim_campaign.campaign_id'] ?? null;

                        foreach ($ids as $idPair) {
                            if (
                                $idPair['organization_id'] == $companyId &&
                                $idPair['campaign_id'] == $campaignId
                            ) {
                                $filteredPerformance[] = $item;
                                break; 
                            }
                        }
                    }
    
                    return response()->json([
                        'simplifi_ads_data'     => $allCampaigns1,
                        'campaigns_with_stats'  => $campaignsWithStats,
                        'previousstats'         => $previousstats,
                        'totals'                => $totals,
                        'campaign_performance'  => $filteredPerformance,
                    ]);
                } catch (\Exception $e) {
                    \Log::error("Failed to fetch campaign stats: " . $e->getMessage());
                    return response()->json([]);
                }
            }


            public function get_simplify_stats($clients = [], $range = '7'){
                $dates = $this->getDateRange($range);
                $currentStart  = $dates['currentStart'];
                $currentEnd    = $dates['currentEnd'];
                $previousStart = $dates['previousStart'];
                $previousEnd   = $dates['previousEnd'];


                
                $url = "https://app.simpli.fi/api/organizations/"; // Replace with your actual endpoint

                $headers = [
                    "X-App-Key: 0133dbc0-147b-45aa-96f5-a28d90d1763b",
                    "X-User-Key: 611d82ac-30d9-4f7c-92e2-916d3479f744",
                    "Content-Type: application/json"
                ];

                $ch = curl_init($url);

                curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

                $response = curl_exec($ch);

                if (curl_errno($ch)) {
                    echo 'Request Error: ' . curl_error($ch);
                }

                curl_close($ch);


                $campaigns_data = [];
                if($response) {
                    $response = json_decode($response);
                                ini_set('max_execution_time', 300);
                    foreach($response->organizations as $organization) {
                        $org_id = $organization->id;
                        $org_name = $organization->name;

                        // Fetch campaigns for the organization
                        $campaigns_url = "https://app.simpli.fi/api/organizations/{$org_id}/campaign_stats?end_date=2025-10-31&start_date=2025-10-01";
                        $ch = curl_init($campaigns_url);
                        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
                        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                        $campaigns_response = curl_exec($ch);

                        if (curl_errno($ch)) {
                            echo 'Request Error: ' . curl_error($ch);
                        }

                        curl_close($ch);

                        $campaigns_data[] = json_decode($campaigns_response);
                    }
                }
                return response()->json([
                    'currentStart'  => $currentStart,
                    'currentEnd'    => $currentEnd,
                    'previousStart' => $previousStart,
                    'previousEnd'   => $previousEnd,
                ]); 
                
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


            public function googleSearchConsoleData(Request $request)
            {
                $userId = auth()->id();
                $range = $request->query('range', '7');

                try {
                    $dates = $this->getDateRange($range);
                    $currentStart = $dates['currentStart'];
                    $currentEnd = $dates['currentEnd'];
                    $previousStart = $dates['previousStart'];
                    $previousEnd = $dates['previousEnd'];
                    $current_search_console = SearchConsoleData::where('user_id', $userId)
                        ->whereBetween('date', [$currentStart, $currentEnd])
                        ->get();

                    $previous_search_console = SearchConsoleData::where('user_id', $userId)
                        ->whereBetween('date', [$previousStart, $previousEnd])
                        ->get();

                    return response()->json([
                        'current_search_console'  => $current_search_console,
                        'previous_search_console' => $previous_search_console,
                        'activeRange'             => $range,
                    ]);

                } catch (\Exception $e) {
                    return response()->json(['error' => $e->getMessage()], 400);
                }
            }


            private function json_file_path($request){
                $fileName = "campaigns-data";
                $range = $request->query('range', '7');
                $filterClientId = $request->query('client_id');
                $filterGroupId  = $request->query('group_id');
                $user = $this->get_user();
                $user_role = $user->user_role;
                if($range) {
                    $fileName .= "-$range";
                }

                if($filterClientId) {
                    $fileName .= "-$filterClientId";
                }

                if($filterGroupId) {
                    $fileName .= "-$filterGroupId";
                }

                $fileName = str_replace(":", "-", $fileName);

                $ext = ".json"; 

                $path = $fileName . $user_role . $ext ;
                return $path;
            }


            public function fetchData(Request $request) {
                $path = $this->json_file_path($request);
                $json = Storage::disk('local')->get($path);

                if($json) {
                    return $json;
                } 

                $response = $this->simplifiData($request);
                return $response;
            }

            public function get_user(){
                $user = User::select('id', 'client_id', 'user_role', 'client_Groups_id')
                ->find(Auth::id());
                return $user;
            }


            private function getDatesBetween($start, $end)
            {
                $dates = [];
                $current = Carbon::parse($start);
                $end = Carbon::parse($end);

                while ($current->lte($end)) {
                    $dates[] = $current->toDateString();
                    $current->addDay();
                }

                return $dates;
            }



            public function googleAnalyticsData()
            {

                    // $latestReport = SimpliFiReport::latest()->first();
                    // if (!$latestReport) {
                    //     return response()->json(['error' => 'No report found'], 404);
                    // }
                    // $downloadUrl = $latestReport->download_url;
                    $downloadUrl = "https://app.simpli.fi/report_center/reports/2080031/schedules/3806776/download?code=8db61199791541d651e87cb333a38769d5d16757";
                    $response = Http::get($downloadUrl);
                    if ($response->successful()) {
                        $data = $response->json();
                        

                        return response()->json($data);
                    } else {
                        return response()->json(['error' => 'Failed to fetch data from the provided URL'], 500);
                    }  
                return response()->json([
                    'analytics' => [
                        ['id' => 1, 'metric' => 'Sessions', 'value' => 5000],
                        ['id' => 2, 'metric' => 'Users', 'value' => 3200],
                    ]
                ]);
            }

                public function googleBusinessProfileData()
                {
                    return response()->json([
                        'business' => [
                            ['id' => 1, 'location' => 'Store 1', 'views' => 1200],
                            ['id' => 2, 'location' => 'Store 2', 'views' => 900],
                        ]
                    ]);
                }

                public function googleAdsData()
                {
                    return response()->json([
                        'ads' => [
                            ['id' => 1, 'campaign' => 'Summer Sale', 'spend' => 1200],
                            ['id' => 2, 'campaign' => 'Winter Sale', 'spend' => 800],
                        ]
                    ]);
                }

                public function semrushData(Request $request)
                {
                    $request->validate([
                        'domain' => 'required|string',
                    ]);

                    $domain = $request->input('domain');

                    try {
                        $data = $this->semrushService->domainOverview($domain);
                        return response()->json($data);
                    } catch (\Exception $e) {
                        return response()->json(['error' => 'Failed to get Semrush data', 'message' => $e->getMessage()], 500);
                    }
                }

             
                public function googleSheetsData()
                {
                    return response()->json([
                        'sheets' => [
                            ['id' => 1, 'sheet' => 'Marketing Report', 'rows' => 120],
                            ['id' => 2, 'sheet' => 'Sales Data', 'rows' => 300],
                        ]
                    ]);
                }

                public function facebookInsightsData()
                {
                    return response()->json([
                        'insights' => [
                            ['id' => 1, 'page' => 'Brand Page', 'reach' => 5000],
                            ['id' => 2, 'page' => 'Store Page', 'reach' => 3200],
                        ]
                    ]);
                }

                public function facebookAdsData()
                {
                    return response()->json([
                        'facebook_ads' => [
                            ['id' => 1, 'campaign' => 'FB Ad 1', 'spend' => 600],
                            ['id' => 2, 'campaign' => 'FB Ad 2', 'spend' => 900],
                        ]
                    ]);
                }


                public function getDateRange($range = '7')
                {


                     if (is_string($range) && str_starts_with($range, 'range=')) {
                            $range = str_replace('range=', '', $range);
                        }


                    // 🔥 Check if custom date range e.g. "2025-05-01:2025-05-20"
                    if (strpos($range, ':') !== false) {
                        [$start, $end] = explode(':', $range);

                        $start = Carbon::parse($start);
                        $end   = Carbon::parse($end);

                        // Calculate number of days
                        $days = $start->diffInDays($end) + 1;

                        // Previous period = same length before start
                        $previousStart = $start->copy()->subDays($days);
                        $previousEnd   = $start->copy()->subDay();

                        return [
                            'currentStart'  => $start->format('Y-m-d'),
                            'currentEnd'    => $end->format('Y-m-d'),
                            'previousStart' => $previousStart->format('Y-m-d'),
                            'previousEnd'   => $previousEnd->format('Y-m-d'),
                        ];
                    }


                    switch ($range) {
                        case '30':
                            return [
                                'currentStart'  => now()->subDays(30)->format('Y-m-d'), // last 30 days including today
                                'currentEnd'    => now()->format('Y-m-d'),
                                'previousStart' => now()->subDays(60)->format('Y-m-d'), // 30 days before currentStart
                                'previousEnd'   => now()->subDays(31)->format('Y-m-d'),
                            ];

                        case 'this_month':
                            return [
                                'currentStart'  => now()->startOfMonth()->format('Y-m-d'), // first day of this month
                                'currentEnd'    => now()->format('Y-m-d'),               // today
                                'previousStart' => now()->subMonth()->startOfMonth()->format('Y-m-d'), // first day of last month
                                'previousEnd'   => now()->subMonth()->endOfMonth()->format('Y-m-d'),   // last day of last month
                            ];

                        case 'last_month':
                            return [
                                'currentStart'  => now()->subMonth()->startOfMonth()->format('Y-m-d'),  // first day of last month
                                'currentEnd'    => now()->subMonth()->endOfMonth()->format('Y-m-d'),    // last day of last month
                                'previousStart' => now()->subMonths(2)->startOfMonth()->format('Y-m-d'), // first day of month before last
                                'previousEnd'   => now()->subMonths(2)->endOfMonth()->format('Y-m-d'),   // last day of month before last
                            ];

                        case '6_m':  // Case for last 6 months
                            return [
                                'currentStart'  => now()->subMonths(6)->format('Y-m-d'),  // 6 months ago
                                'currentEnd'    => now()->format('Y-m-d'),
                                'previousStart' => now()->subMonths(12)->format('Y-m-d'), // 6 months before the current 6-month period
                                'previousEnd'   => now()->subMonths(7)->format('Y-m-d'),  // 12 months ago (start of previous 6-month period)
                            ];

                        case '7':
                        default:
                            return [
                                'currentStart'  => now()->subDays(7)->format('Y-m-d'),  // last 7 days including today
                                'currentEnd'    => now()->format('Y-m-d'),
                                'previousStart' => now()->subDays(14)->format('Y-m-d'), // 7 days before currentStart
                                'previousEnd'   => now()->subDays(8)->format('Y-m-d'),
                            ];
                    }
                }

                public function store(Request $request)
                {
                    $dashboard = Dashboard::create([
                        'name' => $request->name,
                        'client_id' => $request->client_id,
                        'client_group_id' => $request->client_group_id,
                        'data_profile' => $request->data_profile,
                        'created_by' => auth()->id()
                    ]);

                    return response()->json([
                        'success' => true,
                        'dashboard' => $dashboard
                    ]);
                }

                public function listDashboards()
                {
                    
                    $user = auth()->user();
                    if ($user->user_role === 'Super Admin') {
                        $dashboards = Dashboard::latest()->get();
                    } else {
                        $dashboards = Dashboard::where(function ($q) use ($user) {
                            if ($user->client_id) {
                                $q->where('client_id', $user->client_id);
                            }

                            if ($user->client_Groups_id) {
                                $q->orWhere('client_group_id', $user->client_Groups_id);
                            }
                        })->latest()->get();
                    }

                    return response()->json([
                        'dashboards' => $dashboards,
                        'clientGroups' => ClientGroup::latest()->get(),
                        'statuses' =>  Client::latest()->get(),
                    ]);
                }

                public function update(Request $request,$id)
                {
                    $dashboard = Dashboard::findOrFail($id);

                    $dashboard->update($request->only([
                        'name',
                        'client_id',
                        'client_group_id',
                        'data_profile'
                    ]));

                    return response()->json(['success'=>true]);
                }
                public function destroy($id)
                {
                    Dashboard::findOrFail($id)->delete();

                    return response()->json(['success'=>true]);
                }


        public function ai_insights(Request $request)
        {
            $range = $request->get('range', 'last_month');

            // ✅ Normalize range properly
            switch ($range) {
                case 'last_month':
                    $start = now()->subMonth()->startOfMonth();
                    $end   = now()->subMonth()->endOfMonth();
                    break;

                case '30':
                    // 👉 map 30 days → current month (since you store monthly only)
                    $start = now()->startOfMonth();
                    $end   = now()->endOfMonth();
                    break;

                case 'this_month':
                default:
                    $start = now()->startOfMonth();
                    $end   = now()->endOfMonth();
                    break;
            }

            $clientId = auth()->user()->client_id;

            // ✅ Exact match (correct)
            $record = \App\Models\AIInsight::where('client_id', $clientId)
                ->whereDate('start_date', $start->format('Y-m-d'))
                ->whereDate('end_date', $end->format('Y-m-d'))
                ->first();

            // ✅ OPTIONAL FALLBACK (important UX)
            if (!$record) {
                return Inertia::render('Insights/ai_insights', [
                    'aiData' => null,
                    'range' => $range,
                    'start_date' => $start->toDateString(),
                    'end_date' => $end->toDateString(),
                    'last_synced_at' => null,
                    'message' => 'No data found. Please sync insights.'
                ]);
            }

            return Inertia::render('Insights/ai_insights', [
                'aiData' => $record->data,
                'range' => $range,
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
                'last_synced_at' => $record->last_synced_at
            ]);
        }

 

            public function getAIPrompt()
            {
                return <<<PROMPT
            You are a client-facing digital marketing reporting analyst for Salt Rank, a marketing agency. Analyze the provided marketing report data and generate both written insights and structured visualization data that can be used by our reporting platform.

            Your output must include:
            1. A full-page monthly performance insight section
            2. Recommended charts and visualizations
            3. Structured chart data in JSON format
            4. KPI cards / scorecard data
            5. Data quality notes when required

            Tone and Style:
            Write in simple, friendly, professional language.
            Keep the writing easy for business owners, executive directors, and marketing teams to understand.
            Be positive, factual, and grounded in the data.
            Do not use hype, cute phrases, emojis, or overly casual language.
            Do not use negative framing such as "struggled," "underperformed," "even with challenges," "declined sharply," or "needs improvement."
            Do not include recommendations for improvement unless specifically asked.
            Use "this month," "last month," or actual month names instead of "this period."
            Do not invent numbers, trends, industry averages, or benchmarks.

            Analysis Rules:
            Use actual numbers from the provided data whenever possible.
            Prioritize business outcomes first: qualified calls, total calls, form submissions, leads, conversions, website visits, direction requests, and cost per lead.
            Use impressions, reach, clicks, profile views, sessions, users, CTR, CPC, and engagement metrics to support the story of visibility and awareness.
            Compare against last month when prior-month data is available.
            Compare against earlier months when it helps show a useful trend.
            Compare to industry averages only when benchmarks are included in the provided data.
            If a metric decreased, frame it constructively and factually without making the report sound negative.
            When multiple channels are provided, explain how the channels worked together to support visibility, traffic, and lead activity.
            If data is missing, incomplete, or unclear, use only the available data and add a brief data quality note.

            Chart Data Rules:
            Only create chart data using metrics that exist in the provided report data.
            Do not create fake trend lines, fake benchmarks, or estimated values.
            If a chart needs month-over-month data, only include months that are present in the data.
            If a chart compares channels, only include channels present in the data.
            If a value is missing, use null rather than guessing.
            Use clear, human-friendly labels.
            Use consistent metric names.
            Include enough structured data for the platform to render the chart without reinterpreting the written summary.
            Include a short insight sentence for every chart explaining what the chart shows.
            Recommend only useful charts. Do not create charts just to fill space.

            STRICT CHART STRUCTURE RULES (MANDATORY):

            1. "data" must ALWAYS be an array of flat objects.
            2. Each object inside "data" MUST follow this format:

            For line, bar, and stacked_bar charts:
            {
            "name": "x-axis value",
            "metric_1": number,
            "metric_2": number
            }

            For donut charts:
            {
            "name": "category label",
            "value": number
            }

            3. Do NOT use nested arrays inside data.
            4. Do NOT return separate arrays like:
            - metrics: []
            - values: []
            - labels: []
            5. Do NOT use keys like:
            - data_json
            - series
            - data_key
            6. All chart data must be directly usable without transformation.

            7. "metrics" field must only contain an array of metric names:
            Example:
            "metrics": ["calls", "leads"]

            8. The "data" field must align with "metrics":
            Example:
            "data": [
            { "name": "April", "calls": 120, "leads": 30 }
            ]

            9. Always keep the same structure for all charts in the response.

            If these rules are not followed, the response is invalid.

            FINAL VALIDATION RULE:
            Before returning the response, ensure all charts follow the exact structure defined above.
            If not, regenerate the charts section correctly.

            Required Output Format:

            {
            "report_title": "Monthly Performance Insights",
            "executive_summary": {
                "headline": "",
                "summary": ""
            },
            "kpi_cards": [
                {
                "title": "",
                "value": "",
                "raw_value": 0,
                "unit": "",
                "comparison_label": "",
                "comparison_value": "",
                "comparison_direction": "up | down | flat | unknown",
                "insight": ""
                }
            ],
            "written_insights": [
                {
                "title": "",
                "body": ""
                }
            ],
            "channel_insights": [
                {
                "channel": "",
                "summary": "",
                "key_metrics": [
                    {
                    "label": "",
                    "value": "",
                    "raw_value": 0,
                    "unit": ""
                    }
                ]
                }
            ],
            "recommended_charts": [
                {
                "chart_id": "",
                "title": "",
                "chart_type": "scorecard | line | bar | stacked_bar | donut | table | funnel",
                "description": "",
                "insight": "",
                "x_axis_label": "",
                "y_axis_label": "",
                "metrics": [],
                "data": [],
                "display_options": {
                    "show_legend": true,
                    "show_values": true,
                    "value_format": "number | currency | percentage | duration"
                }
                }
            ],
            "client_friendly_closing": "",
            "data_quality_notes": []
            }

            Chart Type Guidelines:
            Use scorecard for major KPI totals.
            Use line charts for month-over-month trends.
            Use bar charts for comparing channels, communities, campaigns, or sources.
            Use stacked bar charts for lead source mix, traffic source mix, or spend by channel over time.
            Use donut charts only for simple share-of-total views with a small number of categories.
            Use tables for detailed breakdowns by community, campaign, channel, source, or month.
            Use funnel charts when the data supports a progression such as impressions → clicks → visits → leads.

            Written Insight Requirements:
            Write a full-page level insight section using the executive summary, written insights, channel insights, and closing.
            Include 4–7 written insights.
            Each written insight should be 2–4 sentences.
            Each insight should interpret the data, not just repeat it.
            Use actual numbers in the written insights.
            Keep the tone positive, professional, and grounded.

            Important:
            Return valid JSON only.
            Do not include markdown.
            Do not include commentary outside the JSON.
            Do not include charts that cannot be supported by the data.

            Here is the marketing report data:
            PROMPT;
            }


            public function syncInsights()
            {
                $user = auth()->user();
                $clientId = $user->client_id;

                // 👉 Months you want to ensure exist
                $monthsToCheck = [
                    //now()->startOfMonth(),               // this month
                    now()->subMonth()->startOfMonth()    // last month
                ];


                
                foreach ($monthsToCheck as $monthStart) {

                    $start = $monthStart->copy()->startOfMonth();
                    $end = $monthStart->copy()->endOfMonth();
                    $exists = \App\Models\AIInsight::where('client_id', $clientId)
                        ->whereDate('start_date', $start)
                        ->whereDate('end_date', $end)
                        ->exists();

                    if (!$exists) {
                        // 👉 Dispatch only missing months
                        GenerateAIInsightsJob::dispatch([
                            'start_date' => $start,
                            'end_date' => $end,
                            'user_id' => $user->id,
                            'client_id' => $clientId
                        ]);
                    }
                }

                return back()->with('success', 'Sync completed (missing months only)');
            }




}
