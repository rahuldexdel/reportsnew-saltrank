<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

use App\Models\Site;
use App\Models\SemrushCampaign;
use App\Models\SemrushTrackingPosition;

use App\Models\ClientGroup;
use App\Models\Client;

class AiSemrushController extends Controller
{


     public function index(Request $request)
{
    $range = $request->range ?? '7';
    $selectedClientId = $request->client_id;
    $selectedSiteId = $request->site_id;

    $user = auth()->user();
 $isSuperAdmin = $user->user_role === 'Super Admin';

    // ── Clients dropdown ──────────────────────────────────────────────────────
    if ($isSuperAdmin) {
        // Super admin sees all clients
        $clients = Client::select('id', 'company_name')->get();
    } else {
        // Client role: only their own client record
        $clients = Client::select('id', 'company_name')
            ->where('id', $user->client_id) // adjust to your user→client relationship
            ->get();

        // Force selected client to their own — ignore any request value
        $selectedClientId = $user->client_id;
    }

    // ── Site options ──────────────────────────────────────────────────────────
    $siteOptionsQuery = Site::whereNotNull('project_id')
        ->select('id', 'project_name', 'domain', 'client_id');

    if ($isSuperAdmin) {
        // Super admin: filter by selected client if one is chosen
        if ($selectedClientId) {
            $siteOptionsQuery->where('client_id', $selectedClientId);
        }
    } else {
        // Client role: always scope to their client only
        $siteOptionsQuery->where('client_id', $selectedClientId);
    }

    $siteOptions = $siteOptionsQuery->orderBy('project_name')->get();

    // ── Auto-select site ──────────────────────────────────────────────────────
    if ($siteOptions->count()) {
        $siteBelongsToClient = $siteOptions->contains('id', $selectedSiteId);
        if (!$selectedSiteId || !$siteBelongsToClient) {
            $selectedSiteId = $siteOptions->first()->id;
        }
    } else {
        $selectedSiteId = null;
    }

    // ── Load site data ────────────────────────────────────────────────────────
    $sites = collect();
    if ($selectedSiteId) {
        $siteQuery = Site::with([
            'semrushCampaigns' => function ($query) {
                $query->where('engine', '!=', 'google');
            },
            'semrushCampaigns.trackingPositions' => function ($query) {
                $query->whereIn('id', function ($sub) {
                    $sub->selectRaw('MAX(id)')
                        ->from('semrush_tracking_positions')
                        ->groupBy('semrush_campaign_id', 'prompt_id');
                });
            }
        ])
        ->where('id', $selectedSiteId)
        ->whereNotNull('project_id');

        // Extra safety for client role: ensure they can't access other clients' sites
        if (!$isSuperAdmin) {
            $siteQuery->where('client_id', $selectedClientId);
        }

        $sites = $siteQuery->get();
    }

    return inertia('Insights/semrush_ai', [
        'sites'            => $sites,
        'siteOptions'      => $siteOptions,
        'selectedSiteId'   => (int) $selectedSiteId,
        'clients'          => $clients,
        'selectedClientId' => (int) $selectedClientId,
        'flash'            => session('success'),
        'range'            => $range,
    ]);
}

        public function sync(Request $request)
        {
            $apiKey = config('services.semrush.key');

            $dateBegin = now()->subMonth()->startOfMonth()->format('Ymd');
            //$dateEnd   = now()->endOfMonth()->format('Ymd');
             $dateEnd   = now()->format('Ymd'); // today, not end of month

            $sites = Site::whereIn('domain', [
                'bartoncreekseniorliving.com',
            ])->get();

             // $sites = Site::whereNotNull('project_id')->get();


            foreach ($sites as $site) {
                try {

                    $campaignResponse = Http::timeout(60)->get(
                        "https://api.semrush.com/management/v1/projects/{$site->project_id}/tracking/campaigns",
                        ['key' => $apiKey]
                    );

                    if (!$campaignResponse->successful()) {
                        Log::error('Campaign API failed', [
                            'site_id'  => $site->id,
                            'response' => $campaignResponse->body(),
                        ]);
                        continue;
                    }

                    $campaigns = $campaignResponse->json('campaigns') ?? [];

                    foreach ($campaigns as $item) {

                        $campaign = SemrushCampaign::updateOrCreate(
                            ['campaign_id' => $item['id']],
                            [
                                'site_id'        => $site->id,
                                'project_id'     => $site->project_id,
                                'url'            => $item['url'] ?? null,
                                'engine'         => $item['engine'] ?? null,
                                'device'         => $item['device'] ?? null,
                                'language'       => $item['language'] ?? null,
                                'location_name'  => $item['location']['name'] ?? null,
                                'keywords_count' => $item['keywords_count'] ?? 0,
                                'raw_data'       => $item,
                            ]
                        );

                        $domain = $item['url'] ?? $site->domain;
                        if (!$domain) continue;

                        $urlPattern = "*.$domain/*";

                        $reportResponse = Http::timeout(120)->get(
                            "https://api.semrush.com/reports/v1/projects/{$item['id']}/tracking/",
                            [
                                'key'        => $apiKey,
                                'action'     => 'report',
                                'type'       => 'tracking_position_organic',
                                'url'        => $urlPattern,
                                'date_begin' => $dateBegin,
                                'date_end'   => $dateEnd,
                            ]
                        );

                        if (!$reportResponse->successful()) {
                            Log::error('Tracking API failed', [
                                'site_id'     => $site->id,
                                'campaign_id' => $item['id'],
                                'response'    => $reportResponse->body(),
                            ]);
                            continue;
                        }

                        $report = $reportResponse->json();

                        // ✅ ONE loop — one row per keyword, no inner Dt loop
                     foreach ($report['data'] ?? [] as $row) {

                        $rawPos   = $row['Fi'][$urlPattern] ?? null;
                        $position = ($rawPos === null || $rawPos === '-') ? null : (int) $rawPos;

                        $dtKeys      = array_keys($row['Dt'] ?? []);
                        $latestDate  = !empty($dtKeys) ? end($dtKeys) : null;
                        $trackingDate = $latestDate
                            ? Carbon::createFromFormat('Ymd', $latestDate)->toDateString()
                            : now()->toDateString();

                        $visibility   = $latestDate ? ($row['Vi'][$latestDate][$urlPattern]  ?? 0) : 0;
                        $sov          = $latestDate ? ($row['Sov'][$latestDate][$urlPattern] ?? 0) : 0;
                        $traffic      = $latestDate ? ($row['Tr'][$latestDate][$urlPattern]  ?? 0) : 0;
                        $trafficCost  = $latestDate ? ($row['Tc'][$latestDate][$urlPattern]  ?? 0) : 0;
                        $serpFeatures = $latestDate ? ($row['Sf'][$latestDate] ?? []) : [];

                        // ✅ Find existing row first so we can merge Dt history
                        $existing = SemrushTrackingPosition::where('semrush_campaign_id', $campaign->id)
                            ->where('prompt_id', $row['Pi'] ?? null)
                            ->first();

                        if ($existing && isset($existing->raw_data['Dt'])) {
                            $oldRaw = $existing->raw_data;

                            // Guard: if stored data is corrupted (sequential array, no date keys), discard it
                            // A valid Dt looks like {"20260325": {...}} not [{...}, {...}]
                            $isSafe = function($data) {
                                if (!is_array($data) || empty($data)) return false;
                                $firstKey = array_key_first($data);
                                // Date keys are 8-digit numbers like 20260325, or "Diff"
                                // A corrupted array has keys 0, 1, 2...
                                return $firstKey !== 0 && $firstKey !== '0';
                            };

                            // Use + operator instead of array_merge:
                            // - Preserves integer-cast date keys (array_merge would reindex them!)
                            // - OLD data wins for existing dates (don't overwrite stored history)
                            // - NEW dates from API get added
                            $row['Dt']  = ($isSafe($oldRaw['Dt']  ?? null) ? $oldRaw['Dt']  : []) + ($row['Dt']  ?? []);
                            $row['Vi']  = ($isSafe($oldRaw['Vi']  ?? null) ? $oldRaw['Vi']  : []) + ($row['Vi']  ?? []);
                            $row['Sov'] = ($isSafe($oldRaw['Sov'] ?? null) ? $oldRaw['Sov'] : []) + ($row['Sov'] ?? []);
                            $row['Tr']  = ($isSafe($oldRaw['Tr']  ?? null) ? $oldRaw['Tr']  : []) + ($row['Tr']  ?? []);
                            $row['Tc']  = ($isSafe($oldRaw['Tc']  ?? null) ? $oldRaw['Tc']  : []) + ($row['Tc']  ?? []);
                            $row['Sf']  = ($isSafe($oldRaw['Sf']  ?? null) ? $oldRaw['Sf']  : []) + ($row['Sf']  ?? []);
                            $row['Lu']  = ($isSafe($oldRaw['Lu']  ?? null) ? $oldRaw['Lu']  : []) + ($row['Lu']  ?? []);
                            $row['Lt']  = ($isSafe($oldRaw['Lt']  ?? null) ? $oldRaw['Lt']  : []) + ($row['Lt']  ?? []);
                        }
                        SemrushTrackingPosition::updateOrCreate(
                            [
                                'semrush_campaign_id' => $campaign->id,
                                'prompt_id'           => $row['Pi'] ?? null,
                            ],
                            [
                                'site_id'       => $site->id,
                                'keyword'       => $row['Ph'] ?? '',
                                'tracking_date' => $trackingDate,
                                'position'      => $position,
                                'visibility'    => $visibility,
                                'sov'           => $sov,
                                'traffic'       => $traffic,
                                'traffic_cost'  => $trafficCost,
                                'serp_features' => $serpFeatures,
                                'raw_data'      => $row, // now contains merged history
                            ]
                        );

                    } // end foreach keyword

                        usleep(500000);

                    } // end foreach campaign

                } catch (\Exception $e) {
                    Log::error('SEMrush Sync Error', [
                        'site_id' => $site->id,
                        'message' => $e->getMessage(),
                    ]);
                }

            } // end foreach site

            return redirect()->back()->with('success', 'SEMrush AI data synced successfully.');
        }

}