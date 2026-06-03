<?php

namespace App\Jobs;

use App\Models\Competitor;
use App\Models\OrganicKeyword;
use App\Models\Site;
use App\Services\SemrushService;
use Carbon\Carbon;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class FetchSemrushDataJob implements ShouldQueue
{
    use Dispatchable, Queueable;

    public function __construct(
        public int $siteId,
        public bool $isFirstRun = false,
        public ?string $monthDate = null
    ) {}

    public function handle(SemrushService $semrush)
    {
        $site = Site::with(['competitors', 'semrushAccount'])->findOrFail($this->siteId);
        $account = $site->semrushAccount;

        if (!$account || !$account->api_key) {
            Log::warning("SEMrush API key missing for site ID {$site->id}");
            return;
        }

        $month = $this->monthDate
            ? Carbon::parse($this->monthDate)->startOfMonth()
            : now()->startOfMonth();

        $fetchDate = $month->toDateString();

        $params = [
            'display_sort' => 'po_asc',
        ];

        // IMPORTANT:
        // For previous months, use display_date.
        // For current month, do not use display_date. SEMrush returns latest data.
        if (!$month->isSameMonth(now())) {
            $params['display_date'] = $month->format('Ym') . '15';
        }

        if ($this->isFirstRun || $site->competitors()->count() === 0) {
            $competitors = $semrush->fetchReport(
                $account->api_key,
                $site->domain,
                $site->database,
                'domain_organic_organic',
                'Dn',
                3,
                $params
            );

            foreach ($competitors as $c) {
                if (!empty($c['Domain'])) {
                    Competitor::firstOrCreate([
                        'site_id' => $site->id,
                        'domain' => trim($c['Domain']),
                    ]);
                }
            }

            $site->load('competitors');
        }

        $organic = $semrush->fetchReport(
            $account->api_key,
            $site->domain,
            $site->database,
            'domain_organic',
            'Ph,Pp,Po,Nq,Cp,Ur',
            20,
            $params
        );

        foreach ($organic as $row) {
            $this->saveKeyword($site->id, null, $row, $fetchDate);
        }

        Log::info("SEMrush main data saved", [
            'site_id' => $site->id,
            'domain' => $site->domain,
            'month' => $fetchDate,
            'params' => $params,
            'rows' => count($organic),
        ]);

        foreach ($site->competitors as $competitor) {
            $compKeywords = $semrush->fetchReport(
                $account->api_key,
                $competitor->domain,
                $site->database,
                'domain_organic',
                'Ph,Pp,Po,Nq,Cp,Ur',
                20,
                $params
            );

            foreach ($compKeywords as $row) {
                $this->saveKeyword($site->id, $competitor->id, $row, $fetchDate);
            }

            Log::info("SEMrush competitor data saved", [
                'site_id' => $site->id,
                'competitor_id' => $competitor->id,
                'domain' => $competitor->domain,
                'month' => $fetchDate,
                'rows' => count($compKeywords),
            ]);
        }
    }

    private function saveKeyword(int $siteId, ?int $competitorId, array $row, string $fetchDate): void
    {
        if (empty($row['Keyword'])) {
            return;
        }

        OrganicKeyword::updateOrCreate(
            [
                'site_id' => $siteId,
                'competitor_id' => $competitorId,
                'keyword' => trim($row['Keyword']),
                'fetched_at' => $fetchDate,
            ],
            [
                'position' => $row['Position'] ?? null,
                'previous_position' => $row['Previous Position'] ?? null,
                'search_volume' => $row['Search Volume'] ?? null,
                'cpc' => $row['CPC'] ?? null,
                'url' => $row['Url'] ?? null,
            ]
        );
    }
}