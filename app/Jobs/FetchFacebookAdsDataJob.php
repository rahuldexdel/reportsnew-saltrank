<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;

use Illuminate\Queue\SerializesModels;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use App\Models\FacebookAdsInsight;


class FetchFacebookAdsDataJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $account;
    protected $adAccountId;

    public function __construct($account, $adAccountId)
    {
        $this->account = $account;
        $this->adAccountId = $adAccountId;
    }

    public function handle()
    {
        $response = Http::get(
            "https://graph.facebook.com/v19.0/act_{$this->adAccountId}/insights",
            [
                'fields' => 'impressions,clicks,ctr,cpc,spend,reach,actions',
                'breakdowns' => 'age,gender,device_platform',
                'access_token' => $this->account->token,
            ]
        );

        $data = $response->json();

        foreach ($data['data'] ?? [] as $row) {

            FacebookAdsInsight::create([
                'account_id' => $this->account->id,
                'ad_account_id' => $this->adAccountId,

                'date' => $row['date_start'] ?? null,

                'impressions' => $row['impressions'] ?? 0,
                'clicks' => $row['clicks'] ?? 0,
                'spend' => $row['spend'] ?? 0,
                'ctr' => $row['ctr'] ?? 0,
                'cpc' => $row['cpc'] ?? 0,
                'reach' => $row['reach'] ?? 0,

                'age' => $row['age'] ?? null,
                'gender' => $row['gender'] ?? null,
                'device_platform' => $row['device_platform'] ?? null,

                'metadata' => $row
            ]);
        }
}