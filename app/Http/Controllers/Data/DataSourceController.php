<?php

namespace App\Http\Controllers\Data;

use App\Models\SimplifiAccount;
use App\Models\SimplifiCampaigns;
use App\Models\SimplifiCampaign;
use App\Models\CallrailCompany;
use App\Models\SimplifiCampaignStat;
use App\Models\SimplifiOrganizations;
use Inertia\Inertia;
use App\Models\DataSource;
use Illuminate\Http\Request;
use App\Models\GoogleAccount;
use Google\Client as Google_Client;
use App\Http\Controllers\Controller;
use App\Services\SimplifiApiService;
use Illuminate\Support\Facades\Auth;
use App\Models\GoogleServiceProperty;
use Laravel\Socialite\Facades\Socialite;
use Google\Ads\GoogleAds\Lib\OAuth2TokenBuilder;
use Google\Ads\GoogleAds\Util\V19\ResourceNames;
use Google\Service\Drive as Google_Service_Drive;
use Google\Service\Sheets as Google_Service_Sheets;
use Google\Ads\GoogleAds\Lib\V22\GoogleAdsException;
use Google\Ads\GoogleAds\Lib\V22\GoogleAdsClientBuilder;
use Google\Service\Analytics as Google_Service_Analytics;
use Google\Service\Webmasters as Google_Service_Webmasters;
use Google\Ads\GoogleAds\V19\Services\ListAccessibleCustomersResponse;
use Google\Service\GoogleAnalyticsAdmin as Google_Service_AnalyticsAdmin;
use Google\Service\MyBusinessAccountManagement as Google_Service_MyBusiness;
use App\Services\CallRailService;
use App\Models\CallTrackingAccount;
use App\Models\SemrushAccount;


use Illuminate\Support\Facades\Http;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

use App\Jobs\Simplifi\SyncSimplifiAccountJob;
use App\Jobs\FetchSemrushDataJob;
use App\Models\Site;
use App\Models\OrganicKeyword;

use App\Jobs\FetchGoogleAdsDataJob;
use App\Models\GoogleAdsAccount;
 use App\Jobs\Simplifi\DailySimplifiSyncJob;
 use App\Jobs\Analytics\SyncGa4DataJob;
 use Google\Ads\GoogleAds\V22\Services\SearchGoogleAdsRequest;
use App\Jobs\FetchFacebookAdsDataJob;

 

class DataSourceController extends Controller
{
    private SimplifiApiService $simplifiApiService;
      private CallRailService $CallRailService;

    /**
     * Summary of index
     * @return \Inertia\Response
     */
    public function index()
    {
        // Render all Data Sources
        return Inertia::render('Data/Datasource', [
            'dataSources' => DataSource::all()
        ]);
    }


    /**
     * Add Google Accounts Redirect
     * @param mixed $service
     * @return \Illuminate\Http\RedirectResponse|\Symfony\Component\HttpFoundation\RedirectResponse
     */
    public function redirect($service)
    {
        if ($service === 'facebook_ads') {
            return Socialite::driver('facebook')
                ->scopes([
                    'ads_read',
                    'ads_management',
                    'business_management'
                ])
                ->redirect();
        }
            $scopes = match ($service) {
                'analytics' => ['https://www.googleapis.com/auth/analytics.readonly'],
                'search-console' => [Google_Service_Webmasters::WEBMASTERS_READONLY],
                'ads' => ['https://www.googleapis.com/auth/adwords'],
                'business-profile' => ['https://www.googleapis.com/auth/business.manage'],
                'sheets' => [
                    Google_Service_Sheets::SPREADSHEETS,
                    Google_Service_Drive::DRIVE_METADATA_READONLY
                ],
                default => abort(404, 'Invalid service type'),
            };

        return Socialite::driver('google')
            ->scopes($scopes)
            ->with([
                'access_type' => 'offline',
                'prompt' => 'consent',
                'state' => $service, // 👈 pass service here
            ])
            ->redirectUrl(route('google.oauth.callback'))
            ->redirect();
    }

    /**
     * Google Auth callback
     * @param mixed $service
     * @return \Illuminate\Http\RedirectResponse
     */
    public function callback(Request $request)
    {

      $service = $request->get('state'); 
        try {             
                $googleUser = Socialite::driver('google')
                ->stateless()
                ->redirectUrl(route('google.oauth.callback'))
                ->user();
            $account = GoogleAccount::updateOrCreate(
                [
                    'google_id' => $googleUser->getId(),
                    'type' => $service,
                ],
                [
                    'user_id' => Auth::id(),
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'token' => $googleUser->token,
                    'refresh_token' => $googleUser->refreshToken,
                    'expires_at' => now()->addSeconds($googleUser->expiresIn),
                    'access_type' => 'offline',
                    'scopes' => $googleUser->approvedScopes ?? [],
                    'is_connected' => true,
                ]
            );
            if ($account->wasRecentlyCreated) {
                DataSource::where('service', $service)->update(['is_connected' => true,]);
                DataSource::where('service', $service)->increment('total_connections');
            }
            // Fetch sites immediately after connection
            $this->fetchServiceProperties($account);

            return redirect()->route('datasource.index')->with('success', ucfirst($service) . ' account connected successfully');

        } catch (\Exception $e) {
            return redirect()->route('datasource.index')->with('error', 'Failed to connect account: ' . $e->getMessage());
        }
    }

    /**
     * Summary of fetchServiceProperties
     * @param \App\Models\GoogleAccount $account
     * @throws \Exception
     * @return void
     */
    protected function fetchServiceProperties(GoogleAccount $account)
    {
        // Check if the account is connected
        if (!$account) {
            throw new \Exception('No Google account found');
        }
        // Get the Google Client Access Token
        $client = new Google_Client();
        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));
        $client->setAccessToken([
            'access_token' => $account->token,
            'refresh_token' => $account->refresh_token,
            'expires_in' => now()->diffInSeconds($account->expires_at),
        ]);

        // Check if the access token is expired
        // If expired, refresh the token
        if ($client->isAccessTokenExpired()) {
            $client->fetchAccessTokenWithRefreshToken($account->refresh_token);
            $newToken = $client->getAccessToken();

            $account->update([
                'token' => $newToken['access_token'],
                'expires_at' => now()->addSeconds($newToken['expires_in']),
                'refresh_token' => $newToken['refresh_token'] ?? $account->refresh_token,
            ]);
        }
        // Fetch properties based on the account type
        try {
            switch ($account->type) {
                case 'analytics':
                    $this->fetchAnalyticsProperties($account, $client);
                    break;
                case 'search-console':
                    $this->fetchSearchConsoleProperties($account, $client);
                    break;
                case 'ads':
                    $this->fetchAdsProperties($account, $client);
                    break;
                case 'business-profile':
                    $this->fetchBusinessProfileProperties($account, $client);
                    break;
                case 'sheets':
                    $this->fetchSheetProperties($account, $client);
                    break;
                default:
                    throw new \Exception('Unsupported service type');
            }
        } catch (\Exception $e) {
            \Log::error('Failed to fetch properties for ' . $account->type . ': ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Summary of fetchAnalyticsProperties
     * @param \App\Models\GoogleAccount $account
     * @param \Google\Client $client
     * @return void
     */
    protected function fetchAnalyticsProperties(GoogleAccount $account, Google_Client $client)
    {

        $adminService = new Google_Service_AnalyticsAdmin($client);
        try {
            // Get all GA4 accounts accessible by the user
            $accountsResponse = $adminService->accounts->listAccounts();
            if (empty($accountsResponse->getAccounts())) {
                throw new \Exception('No Google Analytics accounts found');
            }
            $newPropertiesAdded = false;
            foreach ($accountsResponse->getAccounts() as $gaAccount) {
                $accountId = $gaAccount->name; // e.g. "accounts/123456789"

                // Get GA4 properties under this account
                $propertiesResponse = $adminService->properties->listProperties([
                    'filter' => "parent:$accountId"
                ]);

                // dd($gaAccount);
                foreach ($propertiesResponse->getProperties() as $property) {
                    $propertyId = str_replace('properties/', '', $property->name);

                    // Save to your database
                     $propertyModel = GoogleServiceProperty::updateOrCreate(
                        [
                            'google_account_id' => $account->id,
                            'service_type' => 'analytics',
                            'property_id' => $gaAccount->displayName . ' > ' . $property->displayName . '(' . $propertyId . ')',
                        ],
                        [
                            'user_id' => $account->user_id,
                            'property_name' => $gaAccount->displayName . ' > ' . $property->displayName . ' (' . $propertyId . ')',
                            'metadata' => [
                                'account_id' => str_replace('accounts/', '', $gaAccount->name),
                                'account_name' => $gaAccount->displayName,
                                'property_id' => $propertyId,
                                'property_name' => $property->displayName,
                                'property_time_zone' => $property->timeZone,
                                'property_industry_category' => $property->industryCategory,
                                'property_create_time' => $property->createTime,
                                'property_update_time' => $property->updateTime,
                            ]
                        ]
                    );

                    if ($propertyModel->wasRecentlyCreated) {
                        SyncGa4DataJob::dispatch($propertyModel->id);
                    }
                }
            }
            // if ($newPropertiesAdded) {
            //     SyncGa4DataJob::dispatch($account->id);
            // }
        } catch (\Exception $e) {
            \Log::error('Google Analytics API Error: ' . $e->getMessage());
            throw new \Exception('Failed to fetch Analytics properties: ' . $e->getMessage());
        }
    }


    /**
     * Summary of fetchSearchConsoleProperties
     * @param \App\Models\GoogleAccount $account
     * @param \Google\Client $client
     * @return void
     */
    protected function fetchSearchConsoleProperties(GoogleAccount $account, Google_Client $client)
    {
        $service = new Google_Service_Webmasters($client);

        try {
            $sites = $service->sites->listSites();

            if (empty($sites->getSiteEntry())) {
                throw new \Exception('No Search Console sites found');
            }

            foreach ($sites->getSiteEntry() as $site) {
                GoogleServiceProperty::updateOrCreate(
                    [
                        'google_account_id' => $account->id,
                        'service_type' => 'search-console',
                        'property_id' => $site->getSiteUrl(),
                    ],
                    [
                        'user_id' => $account->user_id,
                        'property_name' => $site->getSiteUrl(),
                        'permission_level' => $site->getPermissionLevel(),
                        'is_verified' => $site->getPermissionLevel() !== 'siteUnverifiedUser',
                        'metadata' => [
                            'site_url' => $site->getSiteUrl(),
                            'permission_level' => $site->getPermissionLevel(),
                        ]
                    ]
                );
            }
        } catch (\Exception $e) {
            \Log::error('Search Console API Error: ' . $e->getMessage());
            throw new \Exception('Failed to fetch Search Console properties: ' . $e->getMessage());
        }
    }

    /**
     * Summary of fetchAdsProperties
     * @param \App\Models\GoogleAccount $account
     * @param \Google\Client $client
     * @return void
     */


   protected function fetchAdsProperties(GoogleAccount $account, Google_Client $client)
    {
        if (empty(config('services.google.ads_developer_token'))) {
            throw new \Exception('Google Ads developer token not configured');
        }
        try {
            $oAuth2Credential = (new OAuth2TokenBuilder())
                ->withClientId(config('services.google.client_id'))
                ->withClientSecret(config('services.google.client_secret'))
                ->withRefreshToken($account->refresh_token)
                ->build();
            // Base client (no login customer)
            $googleAdsClient = (new GoogleAdsClientBuilder())
                ->withDeveloperToken(config('services.google.ads_developer_token'))
                ->withOAuth2Credential($oAuth2Credential)
                ->build();

            $customerService = $googleAdsClient->getCustomerServiceClient();

            $accessibleCustomers = $customerService->listAccessibleCustomers(
                new \Google\Ads\GoogleAds\V22\Services\ListAccessibleCustomersRequest()
            );

            if (empty($accessibleCustomers->getResourceNames())) {
                throw new \Exception('No accessible Google Ads accounts found');
            }
            foreach ($accessibleCustomers->getResourceNames() as $customerResource) {

                $mccId = substr($customerResource, strrpos($customerResource, '/') + 1);
                GoogleServiceProperty::updateOrCreate(
                    [
                        'google_account_id' => $account->id,
                        'service_type' => 'ads',
                        'property_id' => $mccId,
                    ],
                    [
                        'user_id' => $account->user_id,
                        'property_name' => 'Google Ads MCC ' . $mccId,
                        'is_verified' => true,
                        'is_active' => 1,
                        'metadata' => [
                            'customer_id'   => $mccId,
                            'resource_name' => $customerResource,
                            'manager'       => true,
                        ],
                    ]
                );
                $googleAdsClientWithLogin = (new GoogleAdsClientBuilder())
                    ->withDeveloperToken(config('services.google.ads_developer_token'))
                    ->withOAuth2Credential($oAuth2Credential)
                    ->withLoginCustomerId($mccId)
                    ->build();

                $googleAdsServiceClient = $googleAdsClientWithLogin->getGoogleAdsServiceClient();
                $query = "
                    SELECT
                        customer_client.client_customer,
                        customer_client.descriptive_name,
                        customer_client.currency_code,
                        customer_client.time_zone,
                        customer_client.manager,
                        customer_client.test_account,
                        customer_client.level
                    FROM customer_client
                    WHERE customer_client.status = 'ENABLED'
                ";
                $request = new SearchGoogleAdsRequest([
                    'customer_id' => $mccId,
                    'query' => $query,
                ]);
                $response = $googleAdsServiceClient->search($request);
                foreach ($response->iterateAllElements() as $row) {
                    $customer = $row->getCustomerClient();
                    if ($customer->getManager()) {
                        continue;
                    }
                    $clientCustomerResource = $customer->getClientCustomer();
                    $clientId = substr($clientCustomerResource, strrpos($clientCustomerResource, '/') + 1);
                    GoogleServiceProperty::updateOrCreate(
                        [
                            'google_account_id' => $account->id,
                            'service_type' => 'ads',
                            'property_id' => $clientId,
                        ],
                        [
                            'user_id' => $account->user_id,
                            'property_name' => $customer->getDescriptiveName(),
                            'is_verified' => true,
                            'is_active' => 1,
                            'metadata' => [
                                'customer_id'      => $clientId,
                                'descriptive_name' => $customer->getDescriptiveName(),
                                'currency_code'    => $customer->getCurrencyCode(),
                                'time_zone'        => $customer->getTimeZone(),
                                'manager'          => false,
                                'test_account'     => $customer->getTestAccount(),
                                'level'            => $customer->getLevel(),
                                'mcc_id'           => $mccId,
                                'resource_name'    => $clientCustomerResource,
                            ],
                        ]
                    );
                    FetchGoogleAdsDataJob::dispatch($account, $clientId);
                }
            }
        } catch (GoogleAdsException $e) {

            $errors = [];
            foreach ($e->getGoogleAdsFailure()->getErrors() as $error) {
                $errors[] = $error->getMessage();
            }
            \Log::error('Google Ads API Error: ' . implode(', ', $errors));
            throw new \Exception('Google Ads API Error: ' . implode(', ', $errors));
        } catch (\Exception $e) {
            \Log::error('Google Ads Error: ' . $e->getMessage());
            throw new \Exception('Failed to fetch Ads properties: ' . $e->getMessage());
        }
    }




    
    /**
     * Summary of fetchBusinessProfileProperties
     * @param \App\Models\GoogleAccount $account
     * @param \Google\Client $client
     * @throws \Exception
     * @return void
     */
    protected function fetchBusinessProfileProperties(GoogleAccount $account, Google_Client $client)
    {
        try {

            if ($account->refresh_token) {
                $client->fetchAccessTokenWithRefreshToken($account->refresh_token);
                $newToken = $client->getAccessToken();

                if (isset($newToken['access_token'])) {
                    $account->update([
                        'token' => $newToken['access_token'],
                        'expires_at' => now()->addSeconds($newToken['expires_in'] ?? 3600),
                    ]);
                }
            }
            $httpClient = new \GuzzleHttp\Client();
            $accounts = $account->gmb_accounts ?? [];
            if (empty($accounts)) {
                throw new \Exception('No stored GMB accounts found. Fetch once and save.');
            }
            $maxRetries = 3;
            foreach ($accounts as $accountName) {
                $locResponse = null;
                $attempt = 0;
                do {
                    try {

                        $locResponse = $httpClient->get(
                            "https://mybusinessbusinessinformation.googleapis.com/v1/{$accountName}/locations?readMask=name,title,storefrontAddress,metadata,primaryCategory,websiteUri,phoneNumbers,latlng",
                            [
                                'headers' => [
                                    'Authorization' => 'Bearer ' . $account->token,
                                    'Accept' => 'application/json',
                                ]
                            ]
                        );

                        break;

                    } catch (\GuzzleHttp\Exception\ClientException $e) {
                        $status = $e->getCode();
                        $body = json_decode($e->getResponse()->getBody(), true);
                        if (
                            $status == 429 &&
                            ($body['error']['details'][0]['metadata']['quota_limit_value'] ?? null) == "0"
                        ) {
                            throw new \Exception("GMB API quota not enabled for project");
                        }
                        if ($status == 429 && $attempt < $maxRetries) {
                            $attempt++;
                            \Log::warning("GMB Locations retry attempt: {$attempt}");
                            sleep(pow(2, $attempt)); // 2s, 4s, 8s
                        } else {
                            throw $e;
                        }
                    }
                } while ($attempt < $maxRetries);

                if (!$locResponse) {
                    \Log::warning("Skipped account {$accountName} due to rate limit");
                    continue;
                }

                $locationsData = json_decode($locResponse->getBody(), true);


                dd( $locationsData);
                $locations = $locationsData['locations'] ?? [];

                foreach ($locations as $location) {

                    GoogleServiceProperty::updateOrCreate(
                        [
                            'google_account_id' => $account->id,
                            'service_type' => 'business-profile',
                            'property_id' => $location['name'],
                        ],
                        [
                            'user_id' => $account->user_id,
                            'property_name' => $location['title'] ?? 'No Name',
                            'is_verified' => ($location['metadata']['verificationState'] ?? '') === 'VERIFIED',
                            'metadata' => [
                                'account_name' => $accountName,
                                'title' => $location['title'] ?? '',
                                'address' => $location['storefrontAddress'] ?? [],
                                'verification_state' => $location['metadata']['verificationState'] ?? '',
                                'primary_category' => $location['primaryCategory'] ?? [],
                                'website_url' => $location['websiteUri'] ?? '',
                                'phone_numbers' => $location['phoneNumbers'] ?? [],
                                'latlng' => $location['latlng'] ?? [],
                            ]
                        ]
                    );
                }

                // ✅ Light throttle between accounts
                usleep(500000); // 0.5 sec
            }

        } catch (\Exception $e) {
            \Log::error('Business Profile API Error: ' . $e->getMessage());
            throw new \Exception('Failed to fetch Business Profile properties: ' . $e->getMessage());
        }
    }




    /**
     * Summary of fetchSheetProperties
     * @param \App\Models\GoogleAccount $accountvoid
     * @param \Google\Client $client
     * @throws \Exception
     * @return void
     */
    protected function fetchSheetProperties(GoogleAccount $account, Google_Client $client)
    {
        try {
            $driveService = new Google_Service_Drive($client);
            $sheetsService = new Google_Service_Sheets($client);

            $response = $driveService->files->listFiles([
                'q' => "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
                'fields' => 'files(id, name, webViewLink, createdTime, modifiedTime, owners, shared)',
                'orderBy' => 'modifiedTime desc',
                'pageSize' => 100
            ]);

            if (empty($response->getFiles())) {
                throw new \Exception('No Google Sheets found');
            }

            foreach ($response->getFiles() as $sheet) {
                $owners = array_map(function ($owner) {
                    return [
                        'email' => $owner->getEmailAddress(),
                        'name' => $owner->getDisplayName(),
                    ];
                }, $sheet->getOwners());

                GoogleServiceProperty::updateOrCreate(
                    [
                        'google_account_id' => $account->id,
                        'service_type' => 'sheets',
                        'property_id' => $sheet->getId(),
                    ],
                    [
                        'user_id' => $account->user_id,
                        'property_name' => $sheet->getName(),
                        'is_verified' => true,
                        'metadata' => [
                            'name' => $sheet->getName(),
                            'url' => $sheet->getWebViewLink(),
                            'created_at' => $sheet->getCreatedTime(),
                            'updated_at' => $sheet->getModifiedTime(),
                            'owners' => $owners,
                            'shared' => $sheet->getShared(),
                            'sheet_count' => $this->getSheetCount($sheetsService, $sheet->getId()),
                        ]
                    ]
                );
            }
        } catch (\Exception $e) {
            \Log::error('Google Sheets API Error: ' . $e->getMessage());
            throw new \Exception('Failed to fetch Sheets properties: ' . $e->getMessage());
        }
    }

    /**
     * Summary of getSheetCount
     * @param \Google\Service\Sheets $service
     * @param mixed $spreadsheetId
     * @return int
     */
    protected function getSheetCount(Google_Service_Sheets $service, $spreadsheetId)
    {
        try {
            $spreadsheet = $service->spreadsheets->get($spreadsheetId, [
                'fields' => 'sheets.properties'
            ]);
            return count($spreadsheet->getSheets());
        } catch (\Exception $e) {
            \Log::error('Failed to get sheet count: ' . $e->getMessage());
            return 0;
        }
    }


    public function connectAccount(Request $request)
    {
        $validated = $request->validate([
            'username' => 'required|string',
            'apikey' => 'required',
        ]);
        try {

            $this->simplifiApiService = app(SimplifiApiService::class);
            $data = $this->simplifiApiService->connect($validated['apikey']);
            foreach ($data['users'] as $user) {
                $account = SimplifiAccount::updateOrCreate(
                    [ 'account_id' => $user['id'] ],
                    [
                        'user_id' => Auth::id(),
                        'name' => $user['name'],
                        'email' => $user['username'] ?? $user['name'],
                        'api_key' => $validated['apikey'],
                        'is_connected' => true,
                    ]
                );
                SyncSimplifiAccountJob::dispatch($account->id);
            }

            if ($account->wasRecentlyCreated) {
                DataSource::where('service', 'simplifi')->update(['is_connected' => true]);
                DataSource::where('service', 'simplifi')->increment('total_connections');
            }

            return redirect()->route('datasource.index')->with('success', 'Simplifi account connected successfully');

        } catch (\Exception $e) {
            return redirect()->route('datasource.index')->with('error', 'Failed to connect account: ' . $e->getMessage());
        }
    }
    public function syncSimplifiData(Request $request)
    {
        try {
            DailySimplifiSyncJob::dispatch();

            return response()->json([
                'success' => true,
                'message' => 'Simplifi sync started in background.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Sync failed: ' . $e->getMessage()
            ], 500);
        }
    }





        private function syncSimplifiDataInternal(SimplifiAccount $account)
            {
                
                $this->simplifiApiService = app(SimplifiApiService::class);
                $organizations = $this->simplifiApiService->fetchOrganizations($account->api_key);
                $data = [];
                $startDate = now()->subMonths(2)->toDateString();
                $endDate   = now()->toDateString();
                if ($organizations) {
                    foreach ($organizations['organizations'] as $organization) {
                        $org = SimplifiOrganizations::updateOrCreate(
                            [
                                'account_id' => $account->id,
                                'organization_id' => $organization['id'],
                            ],
                            [
                                'name' => $organization['name'],
                                'custom_id' => $organization['custom_id'],
                                'ancestry' => $organization['ancestry'],
                                'public_key' => $organization['public_key'],
                                'website' => $organization['website'],
                            ]
                        );
                        ini_set('max_execution_time', 300);
                        //   $campaigns = $this->simplifiApiService->fetchCampaigns($account->api_key, $organization['id']);
                        $campaigns = $this->simplifiApiService->getCampaignStatsCron($account->api_key, $organization['id'] ,$startDate ,$endDate);
                        if (!$campaigns) {
                                continue;
                            }
                        if ($campaigns) {
                            foreach ($campaigns as $campaign) 
                                {
                                $campaignId   = $campaign['campaign_id'] ?? null;
                                $campaignName = $campaign['campaign_name'] ?? null;
                                if (empty($campaign['campaign_id'])) {
                                    continue;
                                }
                                SimplifiCampaign::updateOrCreate(
                                    [
                                    'account_id' => $account->id,
                                        'organization_id'      => $organization['id'],
                                        'campaign_id' => $campaignId,
                                    ],
                                    [
                                        'campaign_name' => $campaignName,
                                    ]
                                );
                                if (!empty($campaign['stats'])) {
                                        foreach ($campaign['stats'] as $stats) {
                                            SimplifiCampaignStat::updateOrCreate(
                                                [
                                                    'account_id' => $account->id,
                                                    'org_id'      => $organization['id'],
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
                        }
                        $this->syncSimplifiAdsInternal(
                            $account->api_key,
                            $organization['id'],
                            $account->id,
                            $startDate,
                            $endDate
                        );
                    }
                }
            }
            private function syncSimplifiAdsInternal(
                string $apiKey,
                int $organizationId,
                int $accountId,
                string $startDate,
                string $endDate
            ) {
                $dates = $this->getDatesBetween($startDate, $endDate);

                foreach ($dates as $date) {

                    try {
                        ini_set('max_execution_time', 300);

                        $campaigns = $this->simplifiApiService
                            ->getCampaignStatsonly(
                                $apiKey,
                                $organizationId,
                                $date,
                                $date
                            );

                        if (!$campaigns) {
                            continue;
                        }

                        foreach ($campaigns as $campaign) {

                            if (empty($campaign['ads_merged'])) {
                                continue;
                            }

                            foreach ($campaign['ads_merged'] as $ad) {

                                DB::table('campaign_daily_stats')->updateOrInsert(
                                    [
                                        'organization_id' => $organizationId,
                                        'account_id'      => $accountId,
                                        'campaign_id'     => $campaign['campaign_id'],
                                        'ad_id'           => $ad['ad_id'],
                                        'stat_date'       => $date,
                                    ],
                                    [
                                        'campaign_name' => $campaign['campaign_name'] ?? null,
                                        'ad_name'       => $ad['ad_name'] ?? null,
                                        'impressions'   => $ad['impressions'] ?? 0,
                                        'clicks'        => $ad['clicks'] ?? 0,
                                        'ctr'           => $ad['ctr'] ?? 0,
                                        'total_spend'   => $ad['total_spend'] ?? 0,
                                        'primary_creative_url' => $ad['primary_creative_url'] ?? null,
                                        'target_url'    => $ad['target_url'] ?? null,
                                        'geofence'      => !empty($campaign['geofence'])
                                            ? json_encode($campaign['geofence'])
                                            : null,
                                        'updated_at'    => now(),
                                        'created_at'    => now(),
                                    ]
                                );
                            }
                        }

                    } catch (\Throwable $e) {
                        \Log::error('Simplifi Ads Sync Error', [
                            'org_id' => $organizationId,
                            'date'   => $date,
                            'error'  => $e->getMessage(),
                        ]);
                    }
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


    // /**
    //  * Summary of fetchAllReports
    //  * @param mixed $days
    //  * @return void
    //  */
    // public function fetchAllReports($days = 30)
    // {
    //     $properties = GoogleServiceProperty::where('is_verified', true)->get();

    //     foreach ($properties as $property) {
    //         try {
    //             $this->fetchPropertyReport($property, $days);
    //         } catch (\Exception $e) {
    //             Log::error("Failed to fetch report for property {$property->id}: " . $e->getMessage());
    //             continue;
    //         }
    //     }
    // }

    // /**
    //  * Fetch report for a specific property
    //  */
    // public function fetchPropertyReport(GoogleServiceProperty $property, $days = 30)
    // {
    //     $account = $property->googleAccount;
    //     if (!$account || !$account->is_connected) {
    //         throw new \Exception("Account not connected");
    //     }

    //     $client = $this->getAuthenticatedClient($account);

    //     switch ($property->service_type) {
    //         case 'search-console':
    //             $this->fetchSearchConsoleReport($property, $client, $days);
    //             break;
    //         case 'analytics':
    //             $this->fetchAnalyticsReport($property, $client, $days);
    //             break;
    //         // Add other service types as needed
    //     }
    // }

    // protected function getAuthenticatedClient($account)
    // {
    //     $client = new Google_Client();
    //     $client->setClientId(config('services.google.client_id'));
    //     $client->setClientSecret(config('services.google.client_secret'));
    //     $client->setAccessToken([
    //         'access_token' => $account->token,
    //         'refresh_token' => $account->refresh_token,
    //         'expires_in' => now()->diffInSeconds($account->expires_at),
    //     ]);

    //     if ($client->isAccessTokenExpired()) {
    //         $client->fetchAccessTokenWithRefreshToken($account->refresh_token);
    //         $newToken = $client->getAccessToken();

    //         $account->update([
    //             'token' => $newToken['access_token'],
    //             'expires_at' => now()->addSeconds($newToken['expires_in']),
    //         ]);
    //     }

    //     return $client;
    // }

    // protected function fetchSearchConsoleReport(GoogleServiceProperty $property, Google_Client $client, $days)
    // {
    //     $service = new Google_Service_Webmasters($client);
    //     $endDate = Carbon::now()->format('Y-m-d');
    //     $startDate = Carbon::now()->subDays($days)->format('Y-m-d');

    //     $request = new SearchAnalyticsQueryRequest();
    //     $request->setStartDate($startDate);
    //     $request->setEndDate($endDate);
    //     $request->setDimensions(['query', 'page', 'date']);
    //     $request->setRowLimit(1000);

    //     $response = $service->searchanalytics->query($property->property_id, $request);
    //     $rows = $response->getRows();

    //     if (empty($rows)) {
    //         return;
    //     }

    //     foreach ($rows as $row) {
    //         $keys = $row->getKeys();
    //         $reportDate = Carbon::createFromFormat('Y-m-d', $keys[2])->format('Y-m-d');

    //         GoogleServiceReport::updateOrCreate(
    //             [
    //                 'property_id' => $property->id,
    //                 'report_date' => $reportDate,
    //                 'report_type' => 'search',
    //                 'dimension_1' => $keys[0], // query
    //                 'dimension_2' => $keys[1], // page
    //             ],
    //             [
    //                 'clicks' => $row->getClicks(),
    //                 'impressions' => $row->getImpressions(),
    //                 'ctr' => $row->getCtr(),
    //                 'position' => $row->getPosition(),
    //                 'raw_data' => json_encode($row),
    //             ]
    //         );
    //     }
    // }

    // protected function fetchAnalyticsReport(GoogleServiceProperty $property, Google_Client $client, $days)
    // {
    //     $service = new Google_Service_Analytics($client);
    //     $viewId = $property->property_id;
    //     $endDate = Carbon::now()->format('Y-m-d');
    //     $startDate = Carbon::now()->subDays($days)->format('Y-m-d');

    //     // Get traffic data
    //     $traffic = $service->data_ga->get(
    //         "ga:$viewId",
    //         $startDate,
    //         $endDate,
    //         'ga:sessions,ga:users,ga:bounceRate',
    //         ['dimensions' => 'ga:date']
    //     );

    //     foreach ($traffic->getRows() as $row) {
    //         $reportDate = Carbon::createFromFormat('Ymd', $row[0])->format('Y-m-d');

    //         GoogleServiceReport::updateOrCreate(
    //             [
    //                 'property_id' => $property->id,
    //                 'report_date' => $reportDate,
    //                 'report_type' => 'traffic',
    //             ],
    //             [
    //                 'sessions' => $row[1],
    //                 'users' => $row[2],
    //                 'bounce_rate' => $row[3],
    //                 'raw_data' => json_encode($row),
    //             ]
    //         );
    //     }

    //     // Get page performance data
    //     $pages = $service->data_ga->get(
    //         "ga:$viewId",
    //         $startDate,
    //         $endDate,
    //         'ga:pageviews,ga:avgTimeOnPage',
    //         ['dimensions' => 'ga:date,ga:pagePath']
    //     );

    //     foreach ($pages->getRows() as $row) {
    //         $reportDate = Carbon::createFromFormat('Ymd', $row[0])->format('Y-m-d');

    //         GoogleServiceReport::updateOrCreate(
    //             [
    //                 'property_id' => $property->id,
    //                 'report_date' => $reportDate,
    //                 'report_type' => 'pages',
    //                 'dimension_1' => $row[1], // page path
    //             ],
    //             [
    //                 'raw_data' => json_encode($row),
    //             ]
    //         );
    //     }
    // }


        public function connectcalltracking(Request $request)
        {
            $validated = $request->validate([
                'key' => 'required|string',
                'account_id' => 'required|string',
            ]);
            try {
                $callRail = new CallRailService($validated['key'], $validated['account_id']);
                $accountData = $callRail->verifyAccount();
                if (isset($accountData['error'])) {
                    return response()->json([
                        'message' => 'Invalid API Key or Account ID.'
                    ], 422);
                }
                $accountName = $accountData['name'] ?? 'CallRail Account';
                $account = CallTrackingAccount::updateOrCreate(
                    ['account_id' => $validated['account_id']],
                    [
                        'user_id' => auth()->id(),
                        'name' => $accountName,
                        'api_key' => $validated['key'],
                        'is_connected' => true,
                    ]
                );
                $page = 1;
                do {
                    $response = $callRail->request(
                        'get',
                        "/a/{$validated['account_id']}/companies.json",
                        ['page' => $page, 'per_page' => 100]
                    );
                    $companies = $response['companies'] ?? [];
                    $totalPages = $response['total_pages'] ?? 1;
                    foreach ($companies as $company) {
                        $companyNumericId = null;

                        if (!empty($company['script_url'])) {
                            preg_match('/companies\/(\d+)/', $company['script_url'], $matches);
                            $companyNumericId = $matches[1] ?? null;
                        }
                        CallrailCompany::updateOrCreate(
                            ['company_id' => $company['id']],
                            [
                                'call_rail_account_id' => $validated['account_id'],
                                'user_id' => auth()->id(),
                                'name' => $company['name'] . 
                                    ($companyNumericId ? ' (Company ID = ' . $companyNumericId . ')' : ''),
                                'property_id' => $companyNumericId,
                                'service_type' => 'callrail',
                                'is_active' => ($company['status'] ?? '') === 'active',
                                'last_synced_at' => null,

                                'metadata' => $company,
                            ]
                        );
                    }
                    $page++;
                } while ($page <= $totalPages);
                // ✅ Update datasource
                DataSource::where('service', 'call-tracking')->update(['is_connected' => true]);
                DataSource::where('service', 'call-tracking')->increment('total_connections');
                return redirect()->route('data.datasource.callrail')
                    ->with('success', 'CallRail connected & companies synced successfully.');

            } catch (\Exception $e) {
                return back()->with('error', 'Failed to connect: ' . $e->getMessage());
            }
        }
        
            public function syncCallTracking()
            {
                try {

                    $account = CallTrackingAccount::where('user_id', auth()->id())
                        ->where('is_connected', true)
                        ->first();

                    if (!$account) {
                        return back()->with('error', 'No connected CallRail account found.');
                    }

                    $callRail = new CallRailService($account->api_key, $account->account_id);

                    $page = 1;

                    do {
                        $response = $callRail->request(
                            'get',
                            "/a/{$account->account_id}/companies.json",
                            ['page' => $page, 'per_page' => 100]
                        );

                        $companies = $response['companies'] ?? [];
                        $totalPages = $response['total_pages'] ?? 1;

                        foreach ($companies as $company) {

                            $companyNumericId = null;

                            if (!empty($company['script_url'])) {
                                preg_match('/companies\/(\d+)/', $company['script_url'], $matches);
                                $companyNumericId = $matches[1] ?? null;
                            }

                            CallrailCompany::updateOrCreate(
                                ['company_id' => $company['id']],
                                [
                                    'call_rail_account_id' => $account->account_id,
                                    'user_id' => auth()->id(),

                                    'name' => $company['name'] .
                                        ($companyNumericId ? ' (Company ID = ' . $companyNumericId . ')' : ''),

                                    'property_id' => $companyNumericId,
                                    'service_type' => 'callrail',
                                    'is_active' => ($company['status'] ?? '') === 'active',
                                    'last_synced_at' => now(),
                                    'metadata' => $company,
                                ]
                            );
                        }

                        $page++;

                    } while ($page <= $totalPages);

                    return back()->with('success', 'Companies synced successfully.');

                } catch (\Exception $e) {
                    return back()->with('error', 'Sync failed: ' . $e->getMessage());
                }
            }


    //    public function connectSemrush(Request $request)
    //     {
    //         $data = $request->validate([
    //             'api_key' => 'required|string',
    //         ]);
    //         $response = Http::get('https://api.semrush.com/', [
    //             'type' => 'domain_ranks',
    //             'key' => $data['api_key'],
    //             'domain' => 'example.com',
    //             'database' => 'us',
    //         ]);
    //         if (!$response->successful() || str_contains($response->body(), 'ERROR')) {
    //             return back()->withErrors([
    //                 'api_key' => 'Invalid SEMrush API key or quota exceeded.',
    //             ]);
    //         }
    //         $account = SemrushAccount::updateOrCreate(
    //             ['user_id' => auth()->id()],
    //             [
    //                 'api_key' => $data['api_key'],
    //                 'status' => 'connected',
    //             ]
    //         );
    //         DataSource::where('service', 'semrush')->update(['is_connected' => true]); 
    //         DataSource::where('service', 'semrush')->increment('total_connections');
    //         return back()->with('success', 'SEMrush account connected successfully');
    //     }



 public function connectSemrush(Request $request)
            {
                $data = $request->validate([
                    'api_key' => 'required|string',
                ]);

                $response = Http::get('https://api.semrush.com/', [
                    'type'     => 'domain_ranks',
                    'key'      => $data['api_key'],
                    'domain'   => 'example.com',
                    'database' => 'us',
                ]);

                if (
                    !$response->successful() ||
                    str_contains($response->body(), 'ERROR')
                ) {
                    return back()->withErrors([
                        'api_key' => 'Invalid SEMrush API key or quota exceeded.',
                    ]);
                }

                $account = SemrushAccount::updateOrCreate(
                    [
                        'user_id' => auth()->id(),
                    ],
                    [
                        'api_key' => $data['api_key'],
                        'status'  => 'connected',
                    ]
                );

                DataSource::where('service', 'semrush')
                    ->update([
                        'is_connected' => true,
                    ]);

                DataSource::where('service', 'semrush')
                    ->increment('total_connections');

                $projectsResponse = Http::get(
                    'https://api.semrush.com/management/v1/projects',
                    [
                        'key' => $data['api_key'],
                    ]
                );

                if ($projectsResponse->successful()) {

                    $projects = $projectsResponse->json();

                    if (is_array($projects)) {

                        foreach ($projects as $project) {

                            $site = Site::updateOrCreate(
                                [
                                    'project_id' => $project['project_id'],
                                    'semrush_account_id' => $account->id,
                                ],

                                [
                                    'project_name'    => $project['project_name'] ?? null,

                                    'domain'          => $project['url'] ?? null,

                                    'client_id'       => null,

                                    'domain_unicode'  => $project['domain_unicode'] ?? null,

                                    'tools'           => $project['tools'] ?? [],

                                    'owner_id'        => $project['owner_id'] ?? null,

                                    'permission'      => $project['permission'] ?? [],

                                    'database'        => 'us',
                                ]
                            );

                            $months = [
                                    now()->subMonth()->startOfMonth(),
                                    now()->startOfMonth(),
                                ];

                                foreach ($months as $month) {

                                    FetchSemrushDataJob::dispatch(
                                        $site->id,
                                        true,
                                        $month->toDateString()
                                    );
                                }


                        }
                    }
                }

                return back()->with(
                    'success',
                    'SEMrush connected and sites synced successfully.'
                );
            }
            


            public function addDomainToSemrush($clientId, $domain)
            {
                $account = SemrushAccount::where('user_id', auth()->id())
                    ->where('status', 'connected')
                    ->firstOrFail();

                $domain = trim($domain);

                $site = Site::create([
                    'semrush_account_id' => $account->id,
                    'domain' => $domain,
                    'client_id' => $clientId ?? null,
                    'database' => 'us',
                ]);

                   $months = [
                        now()->subMonth()->startOfMonth(),
                        now()->startOfMonth(),
                    ];

                    foreach ($months as $month) {
                        $monthDate = $month->toDateString();

                        FetchSemrushDataJob::dispatch(
                            $site->id,
                            true,
                            $monthDate
                        );
                    }

                return $site;
            }


            public function addDomainToSemrushrq(Request $request)
                {
                    $data = $request->validate([
                        'test_domain' => 'required|string',
                    ]);
                    $account = SemrushAccount::where('user_id', auth()->id())
                                            ->where('status', 'connected')
                                            ->firstOrFail();
                    $site = Site::create([
                        'semrush_account_id' => $account->id,
                        'domain' => $data['test_domain'],
                        'client_id' => $request->client_id ?? null, 
                        'database' => 'us',
                    ]);
                    $months = [
                        now()->subMonth()->startOfMonth(),
                        now()->startOfMonth(),
                    ];

                    foreach ($months as $month) {
                        $monthDate = $month->toDateString();

                        FetchSemrushDataJob::dispatch(
                            $site->id,
                            true,
                            $monthDate
                        );
                    }
                    return back()->with('success', 'Domain added successfully');
                }


        public function syncClients($service)
        {
            try {
                $accounts = GoogleAccount::where('type', $service)
                    ->where('is_connected', true)
                    ->get();
                if ($accounts->isEmpty()) {
                    return back()->with('error', 'No connected accounts found.');
                }
                foreach ($accounts as $account) {
                     
                    $this->fetchServiceProperties($account);
                }
                return back()->with('success', 'Clients synced successfully.');
            } catch (\Exception $e) {
                \Log::error('Sync Clients Error: ' . $e->getMessage());
                return back()->with('error', 'Failed to sync clients.');
            }
        }


        public function refreshtoken($service)
        {
            try {
                $accounts = GoogleAccount::where('type', $service)
                    ->where('is_connected', true)
                    ->get();
                if ($accounts->isEmpty()) {
                    return back()->with('error', 'No connected accounts found.');
                }
                foreach ($accounts as $account) {
                    $this->fetchServiceProperties($account);
                }
                return back()->with('success', 'token refreshed successfully.');
            } catch (\Exception $e) {
                \Log::error('refresh token  Error: ' . $e->getMessage());

                return back()->with('error', 'Failed to refresh.');
            }
        }


        public function verifyWebhook(Request $request)
        {
            // Facebook sends a GET request with verify token and challenge.
            $verify_token = 'your_verify_token';  // The token that you have configured in your Facebook app settings
            $hub_verify_token = $request->get('hub_verify_token');
            $hub_challenge = $request->get('hub_challenge');

            // Check if the verify token is the same
            if ($hub_verify_token === $verify_token) {
                // If the token is correct, return the challenge to verify the webhook
                return response($hub_challenge, 200);
            } else {
                // If the token is incorrect, deny access
                return response('Forbidden', 403);
            }
        }

       public function facebookCallback(Request $request)
        {
            try {
                $fbUser = Socialite::driver('facebook')->stateless()->user();

                // 🔹 Convert to long-lived token (60 days)
                $tokenResponse = Http::get('https://graph.facebook.com/v19.0/oauth/access_token', [
                    'grant_type' => 'fb_exchange_token',
                    'client_id' => config('services.facebook.client_id'),
                    'client_secret' => config('services.facebook.client_secret'),
                    'fb_exchange_token' => $fbUser->token,
                ]);

                $longToken = $tokenResponse->json()['access_token'] ?? $fbUser->token;

                // 🔹 Save account
                $account = GoogleAccount::updateOrCreate(
                    [
                        'google_id' => $fbUser->getId(),
                        'type' => 'facebook',
                    ],
                    [
                        'user_id' => Auth::id(),
                        'name' => $fbUser->getName(),
                        'email' => $fbUser->getEmail(),
                        'token' => $longToken,
                        'refresh_token' => null,
                        'expires_at' => now()->addDays(60),
                        'access_type' => 'online',
                        'scopes' => json_encode([
                            'ads_read',
                            'ads_management',
                            'business_management',
                            'pages_show_list'
                        ]),
                        'is_connected' => true,
                    ]
                );

                // 🔹 Fetch ad accounts
                $this->fetchFacebookAdAccounts($account);

                return redirect()->route('datasource.index')
                    ->with('success', 'Facebook Ads connected successfully');

            } catch (\Exception $e) {
                return redirect()->route('datasource.index')
                    ->with('error', 'Facebook Error: ' . $e->getMessage());
            }
        }


        protected function fetchFacebookAdAccounts($account)
        {
            $response = Http::get('https://graph.facebook.com/v19.0/me/adaccounts', [
                'access_token' => $account->token
            ]);

            $data = $response->json();

            if (empty($data['data'])) {
                throw new \Exception('No Facebook Ad Accounts found.');
            }

            foreach ($data['data'] as $adAccount) {

                $property = GoogleServiceProperty::updateOrCreate(
                    [
                        'google_account_id' => $account->id,
                        'service_type' => 'facebook',
                        'property_id' => $adAccount['id'], // act_123
                    ],
                    [
                        'user_id' => $account->user_id,
                        'property_name' => $adAccount['name'],
                        'is_verified' => true,
                        'metadata' => $adAccount,
                    ]
                );

                // 🔹 Dispatch data sync
                FetchFacebookAdsDataJob::dispatch($account, $adAccount['id']);
            }
        }


        public function sync($service)
        {
            try {

                if ($service === 'analytics') {
                    return $this->syncAnalytics();
                }

                if ($service === 'ads') {
                    return $this->syncAds();
                }

                if ($service === 'business-profile') {
                    return $this->syncBusinessProfile();
                }

                if ($service === 'semrush') {

                    return $this->syncAll($service);
                }
                return back()->with('error', 'Invalid service type');

            } catch (\Exception $e) {
                \Log::error('Sync Error: ' . $e->getMessage());
                return back()->with('error', 'Failed to start data sync.');
            }
        }



        private function syncAnalytics()
        {
            $account = GoogleAccount::where('type', 'analytics')
                ->where('is_connected', 1)
                ->first();

            if (!$account) {
                return back()->with('error', 'No connected account found');
            }

            $properties = GoogleServiceProperty::where([
                'google_account_id' => $account->id,
                'service_type' => 'analytics',
                'is_active' => 1
            ])->get();

            foreach ($properties as $property) {
                SyncGa4DataJob::dispatch($property->id)->delay(now()->addSeconds(2));
            }

            return back()->with('success', 'GA4 sync started');
        }

        private function syncAds()
        {
            $account = GoogleAccount::where('type', 'ads')
                ->where('is_connected', true)
                ->first();

            if (!$account) {
                return back()->with('error', 'No connected account found.');
            }

            $properties = GoogleServiceProperty::where('service_type', 'ads')
                ->where('is_active', 1)
                ->get();

            foreach ($properties as $property) {
                FetchGoogleAdsDataJob::dispatch(
                    $account,
                    $property->property_id
                )->delay(now()->addSeconds(2));
            }

            return back()->with('success', 'Ads sync started.');
        }

        private function syncBusinessProfile()
        {
            // your logic here
            dd('Business Profile Sync Triggered');
            \Log::info('Business Profile Sync Triggered');

            return back()->with('success', 'Business Profile sync started.');
        }

            // public function syncData($service)
            // {
            //     try {
            //         $account = GoogleAccount::where('type', $service)
            //             ->where('is_connected', true)
            //             ->first();
            //         if (!$account) {
            //             return back()->with('error', 'No connected account found.');
            //         }
            //         $properties = GoogleServiceProperty::where('service_type', $service)
            //             ->where('is_active', 1)
            //             ->get();
            //         foreach ($properties as $property) {
            //             FetchGoogleAdsDataJob::dispatch(
            //                 $account,           // full model (as you want)
            //                 $property->property_id // customer_id
            //             )->delay(now()->addSeconds(2));
            //         }
            //         return back()->with('success', 'Data sync started in background.');
            //     } catch (\Exception $e) {
            //         \Log::error('Sync Data Error: ' . $e->getMessage());
            //         return back()->with('error', 'Failed to start data sync.');
            //     }
            // }
            // public function syncBusinessProfile($service)
            // {
            //     try {
            //         dd('yeyeye');
            //         return back()->with('success', 'Data sync started in background.');
            //     } catch (\Exception $e) {
            //         \Log::error('Sync Data Error: ' . $e->getMessage());
            //         return back()->with('error', 'Failed to start data sync.');
            //     }
            // }


          public function syncAll($service)
            {
                if ($service !== 'semrush') {
                    return back()->with('error', 'Invalid service');
                }

                $sites = Site::whereNotNull('domain')
                    ->whereNotNull('client_id')
                    ->get();

                foreach ($sites as $site) {

                    $months = [
                        now()->subMonth()->startOfMonth(),
                        now()->startOfMonth(),
                    ];

                    foreach ($months as $month) {
                        $monthDate = $month->toDateString();

                        $alreadyExists = OrganicKeyword::where('site_id', $site->id)
                            ->whereNull('competitor_id')
                            ->whereDate('fetched_at', $monthDate)
                            ->exists();

                        if ($alreadyExists) {
                            continue;
                        }

                        FetchSemrushDataJob::dispatch(
                            $site->id,
                            true,
                            $monthDate
                        );
                    }
                }

                return back()->with('success', 'SEMrush sync started for missing current and previous month data');
            }



}