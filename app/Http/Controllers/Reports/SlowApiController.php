<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\SimplifiCampaign;
use App\Models\SimplifiOrganizations;
use App\Models\SimpliFiReport;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Request;
use App\Services\SimplifiApiService;
use Illuminate\Support\Facades\Storage;
use App\Http\Controllers\Reports\DashboardController;


class SlowApiController extends Controller
{
    public function index(Request $request)
    {

        $range = ['start_date'  => now()->subMonths(6)->format('Y-m-d'),  // 6 months ago
                'end_date'    => now()->format('Y-m-d')];


        // dashboard/simplifi-data?range=2025-07-01:2025-12-15&client_id=11
        // Example logic that might be causing slowness
        $client = new SimplifiApiService();
        $alldata = SimplifiCampaign::select('client_id', 'organization_id', 'campaign_id')->get()->toArray();
        $organizationIds = collect($alldata)
            ->pluck('organization_id')
            ->unique()
            ->toArray();
        $organizations = SimplifiOrganizations::with('account')
            ->when(!empty($organizationIds), function ($q) use ($organizationIds) {
                return $q->whereIn('organization_id', $organizationIds);
            })
            ->get()->toArray();

            $allCampaigns = [];
            foreach ($organizations as $org) {
                $user_key = $org['account']['api_key'] ?? null;
                $org_id   = $org['organization_id'] ?? null;
                if (!$user_key || !$org_id) continue;

                $campaigns = $client->getCampaignStatsCron($user_key, $org_id, $range['start_date'], $range['end_date']);
                ini_set('max_execution_time', 300);
                $allCampaigns[] = [
                    'organization_id' => $org_id,
                    'campaigns' => $campaigns,
                ];
            }

            




            $latestReport = SimpliFiReport::latest()->first();
            // if (!$latestReport) {
            //     return response()->json(['error' => 'No report found'], 404);
            // }
            // $downloadUrl = $latestReport->download_url;
            $downloadUrl = "https://app.simpli.fi/report_center/reports/2332113/schedules/3807150/download?code=ed700908db0ea6fbb7bfffc43e8ed50106224884";
            $response = Http::get($downloadUrl);

            $campaign_performance = [];
            if ($response->successful()) {
                $campaign_performance = collect($response->json())
                    ->values()
                    ->toArray();
            }

        // $client->getCampaignStatsCron(
        //                 $user_key, $org_id, $startDate, $endDate
        //             );
            echo "<pre>";
                print_r([
                'simplifi_ads_data'     => $allCampaigns,
                // 'campaigns_with_stats'  => $campaignsWithStats,
                // 'previousstats'         => $previousstats,
                // 'totals'                => $totals,
                'campaign_performance'  => $campaign_performance,
            ]);
            echo "</pre>";

            $data = [
                'simplifi_ads_data'     => $allCampaigns,
                // 'campaigns_with_stats'  => $campaignsWithStats,
                // 'previousstats'         => $previousstats,
                // 'totals'                => $totals,
                'campaign_performance'  => $campaign_performance,
            ];
        

             $jsonData = json_encode($data, JSON_PRETTY_PRINT);

            // Define the file path (storage/app folder, so not public)
            $filePath = 'campaigns-data.json';

            // Store the JSON file in the private storage (local disk)
            Storage::disk('local')->put($filePath, $jsonData);
            die;
           return response()->json([
                'simplifi_ads_data'     => $allCampaigns,
                // 'campaigns_with_stats'  => $campaignsWithStats,
                // 'previousstats'         => $previousstats,
                // 'totals'                => $totals,
                'campaign_performance'  => $campaign_performance,
            ]);
    }

    public static function put($request) {

        DashboardController::simplifiData($request);

        $path = 'campaigns-data.json';

        $json = Storage::disk('local')->get($path);
        $data = json_decode($json, true);

        dd($data);

        return $data;

    }

}