<?php
use App\Http\Controllers\Data\DataSource\GoogleServiceController;
use App\Http\Controllers\Data\DataSource\SimplifiController;
use App\Http\Controllers\Reports\DashboardController;
use App\Http\Controllers\Reports\AiSummaryController;
use App\Http\Controllers\Reports\CallRailController;
use App\Http\Controllers\Reports\OverviewController;
use Inertia\Inertia;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\ClientContoller;
use App\Http\Controllers\Data\DataSourceController;
use App\Http\Controllers\Admin\ClientGroupContoller;
use App\Http\Controllers\Auth\SocialLoginController;
use App\Http\Controllers\Data\DataSource\GoogleSearchConsoleController;
use App\Http\Controllers\Reports\SlowApiController;
use App\Http\Controllers\Reports\TabSummaryController;
use App\Http\Controllers\Reports\GoogleAdsController;
//se App\Http\Controllers\Api\SemrushController;
use App\Http\Controllers\Data\DataSource\CallrailServiceController;
use App\Http\Controllers\Data\DataSource\SemrushController;
use App\Http\Controllers\Api\Ga4DashboardController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Http\Controllers\Reports\AiSemrushController;



Route::get('/auth/google/callback', [DataSourceController::class, 'callback'])->name('google.oauth.callback');
Route::get('/', function () {
    return redirect()->route('dashboard');
    // return Inertia::render('welcome');
})->name('home');
Route::middleware('guest')->group(function () {
    // social logoin
    Route::get('/auth/{provider}/redirect', [SocialLoginController::class, 'redirect'])->name('social.redirect');
    Route::get('/auth/{provider}/callback', [SocialLoginController::class, 'callback'])->name('social.callback');
});


Route::middleware(['auth', 'verified'])->group(function () {
            Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
            Route::get('dashboard/overview-data', [OverviewController::class, 'overviewData']);
            // Google services
            Route::get('dashboard/analytics-data', [DashboardController::class, 'googleAnalyticsData']);
            Route::get('dashboard/business-profile-data', [DashboardController::class, 'googleBusinessProfileData']);
            Route::get('dashboard/search-console-data', [DashboardController::class, 'googleSearchConsoleData']);
            Route::get('dashboard/ads-data', [DashboardController::class, 'googleAdsData']);
            // Other integrations
           // Route::get('dashboard/semrush-data', [DashboardController::class, 'semrushData']);
           // Route::get('dashboard/simplifi-data', [DashboardController::class, 'fetchData']);
            Route::get('dashboard/simplifi-data', [DashboardController::class, 'simplifiData']);
            Route::get('dashboard/sheets-data', [DashboardController::class, 'googleSheetsData']);
            Route::get('dashboard/facebook_insights-data', [DashboardController::class, 'facebookInsightsData']);
            Route::get('dashboard/facebook_ads-data', [DashboardController::class, 'facebookAdsData']);

            Route::get('dashboard/simplifi-summary', [DashboardController::class, 'simplifiSummary']);
            Route::get('dashboard/submit-form', [DashboardController::class, 'get_simplify_stats']);
            Route::get('dashboard/slow-api', [SlowApiController::class, 'index']);

            Route::prefix('dashboard/callrail')->group(function () {
                Route::get('/timeseries/current', [CallRailController::class, 'currentTimeseries']);
                Route::get('/timeseries/previous', [CallRailController::class, 'previousTimeseries']);
                Route::get('/calls', [CallRailController::class, 'calls']);
                Route::get('/sources', [CallRailController::class, 'sources']);
                Route::get('/campaign', [CallRailController::class, 'campaign']);
            });

            Route::get('/dashboard/semrush', [SemrushController::class, 'domainOverview']);
            // Route::get('/datasource/{service}/syncAll', [DataSourceController::class, 'syncAll'])
            //     ->name('data.datasource.syncAll');

            Route::get('dashboard/single', function () {
                return Inertia::render('Reports/DashboardSingle');
            })->name('dashboard-single');
            Route::get('/data/datasource', [DataSourceController::class, 'index'])->name('datasource.index');
            Route::get('dashboard/ai-summary', [AiSummaryController::class, 'getSummary']);

            Route::prefix('dashboard/ga4')->group(function () {
                Route::get('/overview', [Ga4DashboardController::class, 'overview']);
                Route::get('/timeseries', [Ga4DashboardController::class, 'timeSeries']);
                Route::get('/channels', [Ga4DashboardController::class, 'channels']);
                Route::get('/pages', [Ga4DashboardController::class, 'pages']);
                Route::get('/events', [Ga4DashboardController::class, 'events']);
                Route::get('/devices', [Ga4DashboardController::class, 'devices']);
                Route::get('/locations', [Ga4DashboardController::class, 'locations']);
                Route::get('/referrer', [Ga4DashboardController::class, 'referrers']);
                Route::get('/monthlyAnalytics', [Ga4DashboardController::class, 'monthlyAnalytics']);
                Route::get('/channelMonthlyAnalytics', [Ga4DashboardController::class, 'channelMonthlyAnalytics']);
 
            });

            Route::prefix('dashboard/google-ads')->group(function () {
                Route::get('/overview', [GoogleAdsController::class, 'overview']);
                Route::get('/timeseries', [GoogleAdsController::class, 'timeseries']);
                Route::get('/campaigns', [GoogleAdsController::class, 'campaigns']);
                Route::get('/keywords', [GoogleAdsController::class, 'keywords']);
                Route::get('/search-terms', [GoogleAdsController::class, 'searchTerms']);
                Route::get('/ads', [GoogleAdsController::class, 'ads']);
              //  Route::get('/devices', [GoogleAdsController::class, 'devices']);
                Route::get('/locations', [GoogleAdsController::class, 'locations']);
                Route::get('/demographics', [GoogleAdsController::class, 'demographics']);
               Route::get('/calls', [GoogleAdsController::class, 'calls']);
            });

            Route::get('dashboard/debug/run-ga4/{accountId}', function ($accountId) {
                \App\Jobs\Analytics\SyncGa4DataJob::dispatch((int) $accountId);
                return "GA4 sync job dispatched for account {$accountId}";
            });

            Route::get('/dashboard/report', [DashboardController::class, 'generateReport']);
            Route::get('/dashboard/tab-summaries', [TabSummaryController::class, 'index']);
            Route::post('/dashboard/tab-summary', [TabSummaryController::class, 'store']);
            Route::delete('/dashboard/tab-summary/{id}', [TabSummaryController::class, 'destroy']);
    

            Route::get('/insights-data', [DashboardController::class, 'ai_insights']);
            Route::post('/insights-sync', [DashboardController::class, 'syncInsights']);
            Route::get('/insights/semrush-ai', [AiSemrushController::class, 'index']);

            Route::post('/insights/semrush-ai/sync', [AiSemrushController::class, 'sync'])
                ->name('semrush.ai.sync');

            Route::middleware(['auth', 'role:Super Admin'])->group(function () {
                        Route::get('/auth/google/{service}', [DataSourceController::class, 'redirect'])->name('google.oauth.redirect');
                    //  Route::get('/auth/google/callback', [DataSourceController::class, 'callback'])->name('google.oauth.callback');
                        Route::post('/connectsmplifiaccount', [DataSourceController::class, 'connectAccount'])->name('connect-smplifi-account');
                        Route::post('/sync-smplifi-account', [DataSourceController::class, 'syncSimplifiData'])->name('sync-simplifi-account');
                        Route::post('/connect-call-tracking', [DataSourceController::class, 'connectcalltracking'])->name('connect-call-tracking');
                        Route::post('/sync-call-tracking', [DataSourceController::class, 'syncCallTracking'])->name('data.datasource.syncCompony');
                        Route::get('/data/datasource/call-tracking', [CallrailServiceController::class, 'index'])->name('data.datasource.callrail');
                        Route::post('/callrail/assign-client', [CallrailServiceController::class, 'assignClient'])
                            ->name('callrail.assign.client');
                        Route::post('/callrail/unassign-client', [CallrailServiceController::class, 'unassignClient'])
                            ->name('callrail.unassign.client');
                         Route::post('/data/datasource/semrush/connect', [DataSourceController::class, 'connectSemrush'])->name('connect-semrush');
                        Route::post('/data/datasource/semrush/adddomain', [DataSourceController::class, 'addDomainToSemrush'])->name('add-domain-to-semrush');
                        Route::post('/data/datasource/semrush/adddomain', [DataSourceController::class, 'addDomainToSemrushrq'])->name('add-domain-to-semrushrq');
                        Route::post('/data/datasource/semrush/assign', [SemrushController::class, 'assign'])->name('semrush.assign.client');
                        Route::post('/data/datasource/semrush/unassign', [SemrushController::class, 'unassign'])->name('semrush.unassign.client');
                        Route::get('/data/datasource/semrush', [SemrushController::class, 'index'])->name('data.datasource.semrush');        
                        Route::get('/data/datasource/simplifi', [SimplifiController::class, 'index'])->name('data.datasource.simplifi');
                        Route::post('/simplifi/assign', [SimplifiController::class, 'assign'])->name('simplifi.assign');
                        Route::post('/simplifi/unassign', [SimplifiController::class, 'unAssign'])->name('simplifi.unassign');
                        Route::get('/data/datasource/{service}', [GoogleServiceController::class, 'service'])->name('data.datasource.service');
                        Route::get('/data/datasource/{service}/fetch', [GoogleServiceController::class, 'fetchSites'])->name('data.datasource.fetchsite');
                      //  Route::get('/data/datasource/{service}/fetchData', [GoogleServiceController::class, 'fetchSitesData'])->name('data.datasource.fetchsiteData');


                        Route::get('/data/datasource/{service}/sync-clients',[DataSourceController::class, 'syncClients'])->name('data.datasource.syncClients');
                        Route::get('/data/datasource/{service}/refresh-token',[DataSourceController::class, 'refreshtoken'])->name('data.datasource.refreshtoken');
                        Route::get('/data/datasource/{service}/sync', [DataSourceController::class, 'sync'])->name('data.datasource.sync');

                        // Route::get('/data/datasource/{service}/fetchData', [GoogleServiceController::class, 'fetchGAData'])->name('data.datasource.fetchGAData');
                        // Route::get('/data/datasource/{service}/sync-data', [DataSourceController::class, 'syncData'])->name('data.datasource.syncData');      
                        // Route::get('/data/datasource/{service}/sync-syncBusinessProfile', [DataSourceController::class, 'syncBusinessProfile'])->name('data.datasource.syncBusinessProfile'); 
                        
                        
                        Route::post('/properties/assign', [GoogleServiceController::class, 'assign'])->name('properties.assign');
                        Route::post('/properties/unassign', [GoogleServiceController::class, 'unAssign'])->name('properties.unassign');
                        Route::get('/data/datasource', [DataSourceController::class, 'index'])->name('datasource.index');
                        Route::resource('/admin/clients', ClientContoller::class)->names('admin.clients');
                        Route::resource('/admin/client-groups', ClientGroupContoller::class)->names('admin.client-groups');
                        Route::resource('/admin/users', UserController::class)->names('admin.users');
                        // In web.php (routes file)
                     //   Route::get('/facebook/callback', [DataSourceController::class, 'verifyWebhook']); // Verification callback (GET)
                        Route::post('/facebook/callback', [DataSourceController::class, 'facebookCallback']); // Handling events (POST)                
            });
            // Route::get('/google/accounts', [GoogleAccountController::class, 'index'])->name('google.accounts');
            Route::get('/simplifi/campaign-stats', [App\Http\Controllers\Api\SimplifiController::class, 'campaignStats']);
});
Route::get('/clear-cache', function () {
    Artisan::call('cache:clear');
    Artisan::call('route:clear');
    Artisan::call('config:clear');
    Artisan::call('view:clear');
    return 'All caches cleared!';
});
require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';