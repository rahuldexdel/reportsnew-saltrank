<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Reports\DashboardController;
use App\Models\AiSummary;
use App\Models\Client;

class GenerateMonthlyAiSummaries extends Command
{
    protected $signature = 'ai:generate-monthly';
    protected $description = 'Generate AI summaries';

    public function handle()
        {
            // ✅ Authenticate
            $user = Auth::guard('web')->loginUsingId(5);

            // ⚠️ Same range as dashboard
            $range = 'last_month';
            $month = now()->format('Y-m-d');

            $controller = app(\App\Http\Controllers\Reports\DashboardController::class);
            $clients = \App\Models\Client::all();

            foreach ($clients as $client) {

                // ✅ Create request
                $request = \Illuminate\Http\Request::create(
                    '/dashboard/simplifi-data',
                    'GET',
                    [
                        'range'     => $range,
                        'client_id' => $client->id,
                    ]
                );

                // ✅ Required for auth
                $request->setUserResolver(fn () => $user);
                app()->instance('request', $request);

                // ✅ Call controller
                $response = $controller->simplifiData($request);
                $data = $response->getData(true);

                // 🔎 Safety check
                if (empty($data['totals']['current'])) {
                    $this->warn("No data for client {$client->id}");
                    continue;
                }

                /**
                 * ---------------------------------------------------------
                 * ✅ TOTALS (YOUR EXISTING WORKING LOGIC)
                 * ---------------------------------------------------------
                 */
                $totals   = $data['totals'];
                $current  = $totals['current'];
                $previous = $totals['previous'] ?? [];

                /**
                 * ---------------------------------------------------------
                 * ✅ ADS INSIGHTS (NEW — SAFE)
                 * ---------------------------------------------------------
                 */
                $campaigns = $data['simplifi_ads_data'][0]['campaigns'] ?? [];

                $topCampaign = null;
                $bestAd = null;

                foreach ($campaigns as $campaign) {
                    $campaignImpressions = 0;

                    foreach ($campaign['ads_merged'] as $ad) {
                        $campaignImpressions += $ad['impressions'];

                        if ($ad['impressions'] > 500) {
                            if (!$bestAd || $ad['ctr'] > $bestAd['ctr']) {
                                $bestAd = $ad;
                            }
                        }
                    }

                    if (!$topCampaign || $campaignImpressions > $topCampaign['impressions']) {
                        $topCampaign = [
                            'name' => $campaign['campaign_name'],
                            'impressions' => $campaignImpressions,
                        ];
                    }
                }

                /**
                 * ---------------------------------------------------------
                 * ✅ DATA SENT TO AI
                 * ---------------------------------------------------------
                 */
                $aiData = [
                    'period' => ucfirst(str_replace('_', ' ', $range)),

                    'metrics' => [
                        'impressions' => $current['impressions'] ?? 0,
                        'clicks'      => $current['clicks'] ?? 0,
                        'ctr_percent' => isset($current['ctr'])
                            ? round($current['ctr'] * 100, 2)
                            : 0,
                        'walk_ins'    => $current['walkIns'] ?? 0,
                    ],

                    'comparison' => [
                            'impressions_vs_last_month_percent' =>
                                ($previous['impressions'] ?? 0) > 0
                                    ? round((($current['impressions'] - $previous['impressions']) / $previous['impressions']) * 100, 2)
                                    : null,
                            'clicks_vs_last_month_percent' =>
                                ($previous['clicks'] ?? 0) > 0
                                    ? round((($current['clicks'] - $previous['clicks']) / $previous['clicks']) * 100, 2)
                                    : null,
                            'ctr_vs_last_month_percent' =>
                                ($previous['ctr'] ?? 0) > 0
                                    ? round((($current['ctr'] - $previous['ctr']) / $previous['ctr']) * 100, 2)
                                    : null,
                            'walk_ins_vs_last_month_percent' =>
                                ($previous['walkIns'] ?? 0) > 0
                                    ? round((($current['walkIns'] - $previous['walkIns']) / $previous['walkIns']) * 100, 2)
                                    : null,
                        ],

                    'ads_highlights' => [
                        'top_campaign' => $topCampaign,
                        'best_ctr_ad' => $bestAd ? [
                            'name' => $bestAd['ad_name'],
                            'ctr_percent' => round($bestAd['ctr'] * 100, 2),
                            'impressions' => $bestAd['impressions'],
                        ] : null,
                    ],
                ];

                /**
                 * ---------------------------------------------------------
                 * ✅ AI PROMPT (FORCED NEW LINES)
                 * ---------------------------------------------------------
                 */
                $prompt = "
        Generate a monthly performance summary.

        STRICT RULES:
        - Output 3–5 bullet points
        - EACH bullet MUST be on its OWN LINE
        - Start EVERY line with a dash (-)
        - Focus ONLY on positive results
        - Do NOT include recommendations
        - Do NOT mention challenges
        - Reference exact numbers
        - Use 'this month' wording
        - Keep tone professional and optimistic

        Data:
        " . json_encode($aiData, JSON_PRETTY_PRINT);

                /**
                 * ---------------------------------------------------------
                 * ✅ AI REQUEST
                 * ---------------------------------------------------------
                 */
                $aiResponse = \Illuminate\Support\Facades\Http::withToken(
                    config('services.openai.key')
                )
                    ->timeout(60)
                    ->post('https://api.openai.com/v1/chat/completions', [
                        'model' => 'gpt-4o-mini',
                        'messages' => [
                            ['role' => 'system', 'content' => 'You are a marketing performance analyst.'],
                            ['role' => 'user', 'content' => $prompt],
                        ],
                        'temperature' => 0.3,
                    ]);

                if (!$aiResponse->successful()) {
                    $this->error("AI failed for client {$client->id}");
                    continue;
                }

                /**
                 * ---------------------------------------------------------
                 * ✅ SAVE SUMMARY (UNCHANGED)
                 * ---------------------------------------------------------
                 */
                \App\Models\AiSummary::updateOrCreate(
                    [
                        'client_id' => $client->id,
                        'tab'       => 'simplifi',
                        'range'     => $range,
                        'month'     => $month,
                    ],
                    [
                        'summary_text' => trim(
                            $aiResponse->json('choices.0.message.content')
                        ),
                    ]
                );

                $this->info("✅ Summary generated for client {$client->id}");
            }

            $this->info('🎉 AI summaries completed.');
        }

}
