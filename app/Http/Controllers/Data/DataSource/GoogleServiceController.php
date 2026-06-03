<?php

namespace App\Http\Controllers\Data\DataSource;

use Google\Client;
use Inertia\Inertia;
use App\Models\DataSource;
use App\Models\SearchConsoleSite;
use Illuminate\Http\Request;

use Google\Service\SearchConsole;
use App\Http\Controllers\Controller;
use App\Models\GoogleServiceProperty;


use App\Models\SearchConsoleData;
use App\Services\GoogleAuthService;
use App\Services\SearchConsoleService;
use App\Models\GoogleAccount;
use App\Services\Ga4Service;
use App\Models\ClientGroup;
use App\Models\GoogleAdsCampaign;

 use App\Jobs\Analytics\SyncGa4DataJob;


class GoogleServiceController extends Controller 
{


    protected $googleAuthService;
    protected $searchConsoleService;

    public function __construct(GoogleAuthService $googleAuthService, SearchConsoleService $searchConsoleService)
    {
       
        $this->googleAuthService = $googleAuthService;
        $this->searchConsoleService = $searchConsoleService;
    }

    /**
     * Summary of service
     * @param mixed $service
     * @return \Inertia\Response
     */
        public function service($service)
        {
            $query = GoogleServiceProperty::where('service_type', $service)
                ->with('account')
                ->with('client')
                ->latest();
            if ($service === 'ads') {
                $query->with(['campaigns' => function ($q) {
                    $q->select('id', 'ads_account_id', 'campaign_id', 'name','client_id','is_assigned');
                }]);
            }
            $properties = $query->get();
            if ($service === 'ads') {
                $properties = $properties->map(function ($property) {
                    $property->campaigns = $property->campaigns
                        ->unique('campaign_id')
                        ->values();

                    return $property;
                });
            }
            $service = DataSource::where('service', $service)->first();
            $clients = \App\Models\Client::all();
            return Inertia::render('Data/Datasource/GoogleService', [
                'service' => $service,
                'properties' => $properties,
                'clients' => $clients,
                'clientGroups' => ClientGroup::latest()->get(),
                'statuses' => \App\Models\Client::STATUSES,
            ]);
        }


        public function assign(Request $request)
        {
            $validated = $request->validate([
                'type' => 'required|in:property,campaign',
                'id' => 'required|integer',
                'client_id' => 'required|integer|exists:clients,id',
            ]);
            if ($validated['type'] === 'property') {
                $property = GoogleServiceProperty::findOrFail($validated['id']);
                $property->update([
                    'client_id' => $validated['client_id'],
                    'is_assigned' => true,
                ]);
                if ($property->service_type === 'ads') {
                    GoogleAdsCampaign::where('ads_account_id', $property->id)
                        ->update([
                            'client_id' => $validated['client_id'],
                            'is_assigned' => true,
                        ]);
                }
            }
            if ($validated['type'] === 'campaign') {
                $campaign = GoogleAdsCampaign::findOrFail($validated['id']);
                $campaign->update([
                    'client_id' => $validated['client_id'],
                    'is_assigned' => true,
                ]);
            }
            return back()->with('success', '');
        }


        
        public function unAssign(Request $request)
        {
            $validated = $request->validate([
                'type' => 'required|in:property,campaign',
                'id' => 'required|integer',
            ]);
            if ($validated['type'] === 'property') {
                $property = GoogleServiceProperty::findOrFail($validated['id']);
                $property->update([
                    'client_id' => null,
                    'is_assigned' => false,
                ]);
                if ($property->service_type === 'ads') {
                    GoogleAdsCampaign::where('ads_account_id', $property->id)
                        ->update([
                            'client_id' => null,
                            'is_assigned' => false,
                        ]);
                }
            }
            if ($validated['type'] === 'campaign') {
                $campaign = GoogleAdsCampaign::findOrFail($validated['id']);
                $campaign->update([
                    'client_id' => null,
                    'is_assigned' => false,
                ]);
            }
            return back()->with('success', '');
        }






    public function fetchSites(GoogleAccount $account)
    {
         $account = GoogleAccount::where('user_id', auth()->id())
            ->whereNotNull('token')
            ->firstOrFail();
        $client = new Client();
        $client->setAccessToken($account->token);
        if ($client->isAccessTokenExpired()) {
            $client->fetchAccessTokenWithRefreshToken($account->refresh_token);
            $account->update([
                'token' => json_encode($client->getAccessToken()),
                'expires_at' => now()->addSeconds(3600),
            ]);
        }
        $searchConsole = new SearchConsole($client);
        $sites = $searchConsole->sites->listSites();
        foreach ($sites->getSiteEntry() as $site) {
            if ($site->getPermissionLevel() !== 'siteUnverifiedUser') {
                SearchConsoleSite::updateOrCreate(
                    ['site_url' => $site->getSiteUrl()],
                    [
                        'google_account_id' => $account->id,
                        'permission_level' => $site->getPermissionLevel(),
                        'last_crawled_at' => now()
                    ]
                );
            }
        }
        return response()->json(['success' => true, 'message' => 'All sites migrated successfully..']);

    }


     public function fetchSitesData()
        {
            $userId = 5;
            $accessToken = $this->googleAuthService->getValidAccessToken($userId, 'search-console');
            // Check if we already have data for this user
            $hasData = SearchConsoleData::where('user_id', $userId)->exists();
        
            if (!$hasData) {
                $startDate = now()->subMonths(2)->toDateString();
                $endDate   = now()->toDateString();
              
            } else {
                $startDate = now()->subDay()->toDateString();
                $endDate   = now()->toDateString();
               
            }
            $data = $this->searchConsoleService->fetchAllSearchConsoleData(
                $accessToken, $startDate, $endDate
            );
            $this->saveSearchConsoleData($data, $userId);
           // $this->info("Search Console data synced successfully from {$startDate} to {$endDate}.");
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