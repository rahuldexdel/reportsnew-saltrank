<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Services\SimplifiApiService;
use App\Models\SimplifiOrganizations;

class SimplifiController extends Controller
{
    protected $simplifiApiService;

    public function __construct(SimplifiApiService $simplifiApiService)
    {
        $this->simplifiApiService = $simplifiApiService;
    }

    public function campaignStats(Request $request)
    { 
        try {
            $impressions = 0;
            $clicks = 0;
            $ctr = 0;
            $walkIns = 0;
            $organizations = SimplifiOrganizations::with('account')->get();
            $from = '2025-06-19';
            $to = '2025-06-19';
            $prevImpressions = $prevClicks = $prevCtr = $prevWalkIns = 0;
            $currentDays = \Carbon\Carbon::parse($from)->diffInDays(\Carbon\Carbon::parse($to)) + 1;
            $previousStartDate = \Carbon\Carbon::parse($from)->subDays($currentDays);
            $previousEndDate = \Carbon\Carbon::parse($from)->subDay();

            foreach ($organizations as $key => $organization) {
                $user_key = $organization->account->api_key ?? null;
                $org_id = $organization->organization_id ?? null;

                if (!$user_key || !$org_id) {
                    continue; // skip if key info is missing
                }

                // Convert string dates to Carbon instances for iteration
                $startDate = \Carbon\Carbon::parse($from);
                $endDate = \Carbon\Carbon::parse($to);

                while ($startDate->lte($endDate)) {
                    $currentDate = $startDate->format('Y-m-d');

                    // Call the API for a single date range (1 day)
                    $campaignStats = $this->simplifiApiService->campaignStats($user_key, $org_id, $currentDate, $currentDate);

                    $impressions += isset($campaignStats['campaign_stats'][0]['impressions']) ? (int) $campaignStats['campaign_stats'][0]['impressions'] : 0;
                    $clicks += isset($campaignStats['campaign_stats'][0]['clicks']) ? (int) $campaignStats['campaign_stats'][0]['clicks'] : 0;
                    $ctr += isset($campaignStats['campaign_stats'][0]['ctr']) ? (float) $campaignStats['campaign_stats'][0]['ctr'] : 0;
                    $walkIns += isset($campaignStats['campaign_stats'][0]['weighted_actions']) ? (float) $campaignStats['campaign_stats'][0]['weighted_actions'] : 0;

                    $startDate->addDay(); // move to next day
                }

                // === Previous Range ===
                $prevStart = $previousStartDate->copy();
                $prevEnd = $previousEndDate->copy();

                while ($prevStart->lte($prevEnd)) {
                    $prevDate = $prevStart->format('Y-m-d');

                    $campaignStats = $this->simplifiApiService->campaignStats($user_key, $org_id, $prevDate, $prevDate);

                    $prevImpressions += isset($campaignStats['campaign_stats'][0]['impressions']) ? (int) $campaignStats['campaign_stats'][0]['impressions'] : 0;
                    $prevClicks += isset($campaignStats['campaign_stats'][0]['clicks']) ? (int) $campaignStats['campaign_stats'][0]['clicks'] : 0;
                    $prevCtr += isset($campaignStats['campaign_stats'][0]['ctr']) ? (float) $campaignStats['campaign_stats'][0]['ctr'] : 0;
                    $prevWalkIns += isset($campaignStats['campaign_stats'][0]['weighted_actions']) ? (float) $campaignStats['campaign_stats'][0]['weighted_actions'] : 0;

                    $prevStart->addDay();
                }
            }
            $stats = [
                'impressions' => $impressions,
                'clicks' => $clicks,
                'ctr' => $ctr,
                'walk_ins' => $walkIns,
                'previous_impressions' => $prevImpressions,
                'previous_clicks' => $prevClicks,
                'previous_ctr' => $prevCtr,
                'previous_walk_ins' => $prevWalkIns,
            ];

            return response()->json($stats);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
