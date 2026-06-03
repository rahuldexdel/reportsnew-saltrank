<?php
// app/Services/SearchConsoleService.php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use App\Models\SearchConsoleSite;
use Illuminate\Support\Str;

class SearchConsoleService
{
    public function fetchAnalyticsData(string $siteUrl, string $accessToken, string $startDate, string $endDate)
    {
        $response = Http::withToken($accessToken)
            ->post("https://searchconsole.googleapis.com/webmasters/v3/sites/{$siteUrl}/searchAnalytics/query", [
                'startDate' => $startDate,
                'endDate' => $endDate,
                'dimensions' => ['date',"query", 'page', 'device'],
                'rowLimit' => 10,
            ]);
        if ($response->successful()) {
            return $response->json();
        }
        throw new \Exception("Failed to fetch Search Console data: " . $response->body());
    }

        public function fetchAllSearchConsoleData(string $accessToken, string $startDate, string $endDate)
        {
            $sites = SearchConsoleSite::all();
            $allResults = [];



            foreach ($sites as $site) {
                $siteUrl = $site->site_url;
                $encodedSiteUrl = Str::startsWith($siteUrl, 'sc-domain:') ? $siteUrl : urlencode($siteUrl);

                $response = Http::withToken($accessToken)
                    ->post("https://searchconsole.googleapis.com/webmasters/v3/sites/{$encodedSiteUrl}/searchAnalytics/query", [
                        'startDate' => $startDate,
                        'endDate' => $endDate,
                        'dimensions' => ['date', 'query', 'page', 'device'],
                    ]);

                if ($response->successful()) {
                    $allResults[] = [
                        'site_url' => $siteUrl,
                        'data' => $response->json(),
                    ];
                } else {
                    \Log::error("Failed for {$siteUrl}: " . $response->body());
                }
            }

            return $allResults;
        }

}
