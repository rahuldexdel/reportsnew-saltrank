<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use App\Services\GoogleAdsService;
use App\Models\GoogleAdsCampaignMetric;
use App\Models\GoogleAdsCampaign;
use App\Models\GoogleAdsKeyword;
use App\Models\GoogleAdsSearchTerm;
use App\Models\GoogleAdsAdGroup;
use App\Models\GoogleAdsAd;
use App\Models\GoogleAdsCall;
use App\Models\GoogleAdsDemographic;
use App\Models\GoogleAdsDevice;
use App\Models\GoogleAdsLocation;
use App\Models\GoogleServiceProperty;

use Google\Ads\GoogleAds\V22\Enums\DeviceEnum\Device;
use Google\Ads\GoogleAds\V22\Enums\GeoTargetingTypeEnum\GeoTargetingType;
use Google\Ads\GoogleAds\V22\Enums\GenderTypeEnum\GenderType;
use Google\Ads\GoogleAds\V22\Enums\AgeRangeTypeEnum\AgeRangeType;
use Google\Ads\GoogleAds\V22\Enums\AdTypeEnum\AdType;
use Google\Ads\GoogleAds\V22\Enums\CallStatusEnum\CallStatus;
use Google\Ads\GoogleAds\V22\Enums\AssetFieldTypeEnum\AssetFieldType;
use Google\Ads\GoogleAds\V22\Enums\AdvertisingChannelTypeEnum\AdvertisingChannelType;


class FetchGoogleAdsDataJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $googleAccount;
    protected $customerId;
    protected $property;
    protected $loginCustomerId;
    protected $startDate;
    protected $endDate;
    public function __construct($googleAccount, $customerId)
    {

        $this->googleAccount = $googleAccount;
        $this->customerId = $customerId;
    }

    public function handle(GoogleAdsService $service)
    {


        $this->property = GoogleServiceProperty::where([
            'google_account_id' => $this->googleAccount->id,
            'service_type' => 'ads',
            'property_id' => $this->customerId,
        ])->first();

        if (!$this->property) {
            Log::error("Property not found", ['customer_id' => $this->customerId]);
            return;
        }

        $this->loginCustomerId = $this->property->metadata['mcc_id'] ?? null;

           $range = $this->getDateRange();
            if (!$range) {
                Log::info("Already synced", ['customer_id' => $this->customerId]);
                return;
            }
            $this->startDate = $range['start'];
            $this->endDate   = $range['end'];

        $methods = [
            'fetchCampaigns',
            'fetchDailyMetrics',
            'fetchCampaignDeviceMetrics',
            'fetchKeywords',
            'fetchSearchTerms',
            'fetchAds',
            'fetchGender',
            'fetchAge',
            'fetchCalls',
            'fetchLocations',
        ];

        foreach ($methods as $method) {
            try {
                Log::info("Starting {$method}", ['customer_id' => $this->customerId]);
                $this->{$method}($service);
                Log::info("Completed {$method}", ['customer_id' => $this->customerId]);
            } catch (\Throwable $e) {
                Log::error("Failed {$method}", [
                    'customer_id' => $this->customerId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

            $this->property->update([
                'last_synced_at' => $this->endDate
            ]);
    }

    private function formatAge($ageEnum)
    {
        if (!$ageEnum) return 'UNKNOWN';
        return str_replace('_', '-', str_replace('AGE_RANGE_', '', AgeRangeType::name($ageEnum)));
    }

    private function getDateRange()
    {
        $end = now()->format('Y-m-d');

        if (empty($this->property->last_synced_at)) {
            $start = now()->subDays(30)->format('Y-m-d');
        } else {
            $start = \Carbon\Carbon::parse($this->property->last_synced_at)
                ->addDay()
                ->format('Y-m-d');
        }

        // ✅ Already up to date
        if ($start > $end) {
            return null;
        }

        return [
            'start' => $start,
            'end' => $end,
        ];
    }

    private function getCallDateRange()
    {
        return "call_view.start_call_date_time BETWEEN '{$this->startDate} 00:00:00' 
                AND '{$this->endDate} 23:59:59'";
    }

    /*
    |--------------------------------------------------------------------------
    | DAILY METRICS
    |--------------------------------------------------------------------------
    */
    protected function fetchDailyMetrics(GoogleAdsService $service)
        {
            $where = "segments.date BETWEEN '{$this->startDate}' AND '{$this->endDate}'";

            $query = "
                SELECT
                    segments.date,
                    campaign.id,
                    metrics.impressions,
                    metrics.clicks,
                    metrics.conversions,
                    metrics.ctr,
                    metrics.average_cpc,
                    metrics.cost_micros
                FROM campaign
                WHERE {$where}
                LIMIT 10000
            ";

            $response = $service->query(
                $this->googleAccount,
                $this->customerId,
                $query,
                $this->loginCustomerId
            );

            foreach ($response->iterateAllElements() as $row) {

                if (!$row->getSegments() || !$row->getMetrics()) continue;

                $campaign = $row->getCampaign();
                $metrics  = $row->getMetrics();
                $date     = $row->getSegments()->getDate();

                if (!$date) continue;

                GoogleAdsCampaignMetric::updateOrCreate(
                    [
                        'ads_account_id' => $this->property->id,
                        'campaign_id'    => $campaign->getId(),
                        'date'           => $date,
                    ],
                    [
                        'impressions' => (int) $metrics->getImpressions(),
                        'clicks'      => (int) $metrics->getClicks(),
                        'conversions' => (float) $metrics->getConversions(),
                        'ctr'         => (float) $metrics->getCtr(),
                        'avg_cpc'     => $metrics->getAverageCpc() / 1000000,
                        'cost'        => $metrics->getCostMicros() / 1000000,
                    ]
                );
            }
        }
    /*
    |--------------------------------------------------------------------------
    | CAMPAIGNS
    |--------------------------------------------------------------------------
    */
      protected function fetchCampaigns(GoogleAdsService $service)
        {
            $query = "
                SELECT
                    campaign.id,
                    campaign.name,
                    campaign.advertising_channel_type,
                    campaign.status
                FROM campaign
            ";

            $response = $service->query(
                $this->googleAccount,
                $this->customerId,
                $query,
                $this->loginCustomerId
            );

            foreach ($response->iterateAllElements() as $row) {

                $campaign = $row->getCampaign();

                $typeEnum = $campaign->getAdvertisingChannelType();
                $type = $typeEnum !== null
                    ? AdvertisingChannelType::name($typeEnum)
                    : 'UNKNOWN';

                GoogleAdsCampaign::updateOrCreate(
                    [
                        'ads_account_id' => $this->property->id,
                        'campaign_id'    => $campaign->getId(),
                    ],
                    [
                        'name'   => $campaign->getName(),
                        'type'   => $type,
                        'status' => $campaign->getStatus(),
                    ]
                );
            }
        }
    /*
    |--------------------------------------------------------------------------
    | KEYWORDS
    |--------------------------------------------------------------------------
    */
  protected function fetchKeywords(GoogleAdsService $service)
    {
        $where = "segments.date BETWEEN '{$this->startDate}' AND '{$this->endDate}'";

        $query = "
            SELECT
                segments.date,
                campaign.id, -- ✅ REQUIRED
                ad_group_criterion.keyword.text,
                metrics.impressions,
                metrics.clicks,
                metrics.ctr,
                metrics.cost_micros
            FROM keyword_view
            WHERE {$where}
            LIMIT 5000
        ";

        $response = $service->query(
            $this->googleAccount,
            $this->customerId,
            $query,
            $this->loginCustomerId
        );

        foreach ($response->getIterator() as $row) {

            if (!$row->getSegments() || !$row->getMetrics() || !$row->getCampaign()) continue;

            $date = $row->getSegments()->getDate();
            if (!$date) continue;

            $campaignId = $row->getCampaign()->getId(); // ✅ REQUIRED

            $keyword = $row->getAdGroupCriterion()->getKeyword()->getText();
            if (empty($keyword)) continue;

            GoogleAdsKeyword::updateOrCreate(
                [
                    'ads_account_id' => $this->property->id,
                    'campaign_id'    => $campaignId, // ✅ FIX
                    'keyword'        => $keyword,
                    'date'           => $date,
                ],
                [
                    'impressions' => (int) $row->getMetrics()->getImpressions(),
                    'clicks'      => (int) $row->getMetrics()->getClicks(),
                    'ctr'         => (float) $row->getMetrics()->getCtr(),
                    'cost'        => $row->getMetrics()->getCostMicros() / 1000000
                ]
            );
        }
    }
    /*
    |--------------------------------------------------------------------------
    | SEARCH TERMS
    |--------------------------------------------------------------------------
    */
 protected function fetchSearchTerms(GoogleAdsService $service)
{
    $where = "segments.date BETWEEN '{$this->startDate}' AND '{$this->endDate}'
              AND metrics.impressions > 0
              AND metrics.clicks > 0";

    $query = "
        SELECT
            segments.date,
            campaign.id, -- ✅ REQUIRED
            search_term_view.search_term,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros
        FROM search_term_view
        WHERE {$where}
        LIMIT 5000
    ";

    $response = $service->query(
        $this->googleAccount,
        $this->customerId,
        $query,
        $this->loginCustomerId
    );

    $totals = [];

    foreach ($response->iterateAllElements() as $row) {

        if (!$row->getSegments() || !$row->getMetrics() || !$row->getCampaign()) continue;

        $date = $row->getSegments()->getDate();
        $searchTerm = $row->getSearchTermView()->getSearchTerm();
        $campaignId = $row->getCampaign()->getId();

        if (!$date || !$searchTerm) continue;

        // 🔥 FIXED KEY (campaign + term + date)
        $key = $campaignId . '_' . $searchTerm . '_' . $date;

        if (!isset($totals[$key])) {
            $totals[$key] = [
                'campaign_id' => $campaignId,
                'search_term' => $searchTerm,
                'date'        => $date,
                'impressions' => 0,
                'clicks'      => 0,
                'cost'        => 0,
            ];
        }

        $totals[$key]['impressions'] += (int) $row->getMetrics()->getImpressions();
        $totals[$key]['clicks']      += (int) $row->getMetrics()->getClicks();
        $totals[$key]['cost']        += $row->getMetrics()->getCostMicros() / 1000000;
    }

    // 🔥 SAVE
    foreach ($totals as $data) {

        $ctr = $data['impressions'] > 0
            ? ($data['clicks'] / $data['impressions']) * 100
            : 0;

        GoogleAdsSearchTerm::updateOrCreate(
            [
                'ads_account_id' => $this->property->id,
                'campaign_id'    => $data['campaign_id'], // ✅ FIX
                'search_term'    => $data['search_term'],
                'date'           => $data['date'],
            ],
            [
                'impressions' => $data['impressions'],
                'clicks'      => $data['clicks'],
                'ctr'         => $ctr,
                'cost'        => $data['cost'],
            ]
        );
    }
}
    /*
    |--------------------------------------------------------------------------
    | AD GROUPS
    |--------------------------------------------------------------------------
    */
 protected function fetchAds(GoogleAdsService $service)
{
    $where = "segments.date BETWEEN '{$this->startDate}' AND '{$this->endDate}'";

    $query = "
        SELECT
            segments.date,
            campaign.name,
            campaign.id, 
            campaign.advertising_channel_type,
            ad_group.name,
            ad_group_ad.ad.id,
            ad_group_ad.ad.name,
            ad_group_ad.ad.type,
            ad_group_ad.ad.final_urls,
            ad_group_ad.ad.expanded_text_ad.headline_part1,
            ad_group_ad.ad.expanded_text_ad.description,
            ad_group_ad.ad.responsive_search_ad.headlines,
            ad_group_ad.ad.responsive_search_ad.descriptions,
            ad_group_ad.ad.image_ad.image_url,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros
        FROM ad_group_ad
        WHERE {$where}
        LIMIT 3000
    ";

    $response = $service->query(
        $this->googleAccount,
        $this->customerId,
        $query,
        $this->loginCustomerId
    );

    $rows = [];

    foreach ($response->iteratePages() as $page) {

        foreach ($page->getResponseObject()->getResults() as $row) {

            if (!$row->getSegments() || !$row->getMetrics() || !$row->getAdGroupAd()) continue;

            $ad = $row->getAdGroupAd()->getAd();
            if (!$ad) continue;

            $date = $row->getSegments()->getDate();
            if (!$date) continue;

            $adId = (string) $ad->getId();
            $campaignId = $row->getCampaign()->getId(); 
            $campaignName = $row->getCampaign()->getName();
            $typeEnum = $row->getCampaign()->getAdvertisingChannelType();
            $adType = $typeEnum !== null
                ? AdvertisingChannelType::name($typeEnum)
                : 'UNKNOWN';

            $adGroupName = $row->getAdGroup()->getName();
            $imageUrl = $ad->getImageAd()?->getImageUrl();
            $adname = $ad->getName();

            $isRetargeting =
                str_contains(strtolower($campaignName), 'remarketing') ||
                str_contains(strtolower($campaignName), 'retarget');

            $headline = null;
            $description = null;

            if ($adType === 'SEARCH') {
                if ($ad->hasResponsiveSearchAd()) {
                    $headline = collect($ad->getResponsiveSearchAd()->getHeadlines())
                        ->map(fn($h) => $h->getText())
                        ->implode(' | ');

                    $description = collect($ad->getResponsiveSearchAd()->getDescriptions())
                        ->map(fn($d) => $d->getText())
                        ->implode(' ');
                } elseif ($ad->hasExpandedTextAd()) {
                    $headline = $ad->getExpandedTextAd()->getHeadlinePart1();
                    $description = $ad->getExpandedTextAd()->getDescription();
                }
            }

            if ($adType === 'DISPLAY') {
                $headline = $adname ?: $adGroupName;
                $description = $description ?: $campaignName;
            }

            $url = $ad->getFinalUrls()[0] ?? null;

            $adPreview = $adType === 'DISPLAY'
                ? $imageUrl
                : trim(($headline ?? '') . "\n" . ($description ?? ''));

            $impressions = (int) $row->getMetrics()->getImpressions();
            $clicks = (int) $row->getMetrics()->getClicks();
            $cost = $row->getMetrics()->getCostMicros() / 1000000;

            $ctr = $impressions > 0 ? ($clicks / $impressions) * 100 : 0;
            $avgCpc = $clicks > 0 ? $cost / $clicks : 0;

            $rows[] = [
                'ads_account_id' => $this->property->id,
                'ad_id' => $adId,
                'date' => $date,
                 'campaign_id'    => $campaignId,
                'campaign_name' => $campaignName,
                'ad_group_name' => $adGroupName,
                'type' => $adType,
                'is_retargeting' => $isRetargeting,
                'headline' => $headline,
                'description' => $description,
                'ad_preview' => $adPreview,
                'image_url' => $imageUrl,
                'final_url' => $url,
                'impressions' => $impressions,
                'clicks' => $clicks,
                'cost' => $cost,
                'ctr' => $ctr,
                'avg_cpc' => $avgCpc,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        unset($page); // free memory
    }

    // ✅ BULK UPSERT (no duplicate error ever)
    if (!empty($rows)) {
        GoogleAdsAd::upsert(
            $rows,
            ['ads_account_id', 'campaign_id', 'ad_id', 'date'],
            [
                'campaign_name',
                'ad_group_name',
                'type',
                'is_retargeting',
                'headline',
                'description',
                'ad_preview',
                'image_url',
                'final_url',
                'impressions',
                'clicks',
                'cost',
                'ctr',
                'avg_cpc',
                'updated_at'
            ]
        );
    }
}

    /*
    |--------------------------------------------------------------------------
    | DEMOGRAPHICS
    |--------------------------------------------------------------------------
    */



 protected function fetchLocations(GoogleAdsService $service)
{
    $where = "segments.date BETWEEN '{$this->startDate}' AND '{$this->endDate}'
              AND metrics.impressions > 0
              AND metrics.clicks > 0";

    $query = "
        SELECT
            segments.date,
            campaign.id,
            geographic_view.location_type,
            segments.geo_target_region,
            segments.geo_target_city,
            metrics.impressions,
            metrics.clicks,
            metrics.conversions
        FROM geographic_view
        WHERE {$where}
        LIMIT 1000
    ";

    $response = $service->query(
        $this->googleAccount,
        $this->customerId,
        $query,
        $this->loginCustomerId
    );

    $rowsData = [];
    $geoIds = [];

    // ✅ STEP 1: collect all IDs
    foreach ($response->iterateAllElements() as $row) {

        if (!$row->getSegments() || !$row->getMetrics() || !$row->getCampaign()) continue;

        $date = $row->getSegments()->getDate();
        if (!$date) continue;

        $campaignId = $row->getCampaign()->getId();

        $cityId = $row->getSegments()->getGeoTargetCity();
        $regionId = $row->getSegments()->getGeoTargetRegion();

        $cityId = $cityId ? str_replace('geoTargetConstants/', '', $cityId) : null;
        $regionId = $regionId ? str_replace('geoTargetConstants/', '', $regionId) : null;

        if ($cityId) $geoIds[] = $cityId;
        if ($regionId) $geoIds[] = $regionId;

        $rowsData[] = [
            'date' => $date,
            'campaign_id' => $campaignId,
            'city_id' => $cityId,
            'region_id' => $regionId,
            'locationType' => $row->getGeographicView()->getLocationType(),
            'impressions' => (int) $row->getMetrics()->getImpressions(),
            'clicks' => (int) $row->getMetrics()->getClicks(),
            'conversions' => (float) $row->getMetrics()->getConversions(),
        ];
    }

    // ✅ STEP 2: fetch all geo names in ONE query
    $geoCache = [];

    $geoIds = array_unique(array_filter($geoIds));

    if (!empty($geoIds)) {

        $idsString = implode(',', $geoIds);

        $geoQuery = "
            SELECT
                geo_target_constant.id,
                geo_target_constant.name
            FROM geo_target_constant
            WHERE geo_target_constant.id IN ({$idsString})
        ";

        $geoResponse = $service->query(
            $this->googleAccount,
            $this->customerId,
            $geoQuery,
            $this->loginCustomerId
        );

        foreach ($geoResponse->iterateAllElements() as $geoRow) {
            $geo = $geoRow->getGeoTargetConstant();
            $geoCache[$geo->getId()] = $geo->getName();
        }
    }

    // ✅ STEP 3: process data
    $totals = [];

    foreach ($rowsData as $row) {

        $city = $geoCache[$row['city_id']] ?? 'unknown';
        $region = $geoCache[$row['region_id']] ?? 'unknown';

        $locationType = $row['locationType'] !== null
            ? GeoTargetingType::name($row['locationType'])
            : 'UNKNOWN';

        $typeMap = [
            'AREA_OF_INTEREST' => 'City',
            'LOCATION_OF_PRESENCE' => 'Region',
        ];

        $locationType = $typeMap[$locationType] ?? $locationType;

        $key = $row['campaign_id'] . '_' . $row['date'] . '_' . $city . '_' . $region;

        if (!isset($totals[$key])) {
            $totals[$key] = [
                'campaign_id' => $row['campaign_id'],
                'date' => $row['date'],
                'city' => $city,
                'region' => $region,
                'target_type' => $locationType,
                'impressions' => 0,
                'clicks' => 0,
                'conversions' => 0,
            ];
        }

        $totals[$key]['impressions'] += $row['impressions'];
        $totals[$key]['clicks'] += $row['clicks'];
        $totals[$key]['conversions'] += $row['conversions'];
    }

    // ✅ STEP 4: insert (chunked)
    foreach (array_chunk($totals, 100) as $chunk) {

        foreach ($chunk as $data) {
            GoogleAdsLocation::updateOrCreate(
                [
                    'ads_account_id' => $this->property->id,
                    'campaign_id'    => $data['campaign_id'],
                    'city'           => $data['city'],
                    'region'         => $data['region'],
                    'date'           => $data['date'],
                ],
                [
                    'target_type' => $data['target_type'],
                    'impressions' => $data['impressions'],
                    'clicks'      => $data['clicks'],
                    'conversions' => $data['conversions'],
                ]
            );
        }

        unset($chunk);
        gc_collect_cycles();
    }
}
  
 protected function fetchGender(GoogleAdsService $service)
{
    $where = "segments.date BETWEEN '{$this->startDate}' AND '{$this->endDate}'";

    $query = "
        SELECT
            segments.date,
            campaign.id, -- ✅ REQUIRED
            ad_group_criterion.gender.type,
            metrics.impressions,
            metrics.clicks
        FROM gender_view
        WHERE {$where}
    ";

    $response = $service->query(
        $this->googleAccount,
        $this->customerId, // ✅ FIXED (remove hardcoded)
        $query,
        $this->loginCustomerId
    );

    $totals = [];

    foreach ($response->getIterator() as $row) {

        if (!$row->getAdGroupCriterion() || !$row->getMetrics() || !$row->getCampaign()) continue;

        $date = $row->getSegments()->getDate();
        if (!$date) continue;

        $campaignId = $row->getCampaign()->getId(); // ✅ REQUIRED

        $genderEnum = $row->getAdGroupCriterion()->getGender()->getType();

        $gender = $genderEnum !== null
            ? GenderType::name($genderEnum)
            : 'UNKNOWN';

        // ✅ FIXED KEY (campaign + gender + date)
        $key = $campaignId . '_' . $gender . '_' . $date;

        if (!isset($totals[$key])) {
            $totals[$key] = [
                'campaign_id' => $campaignId,
                'gender'      => $gender,
                'date'        => $date,
                'impressions' => 0,
                'clicks'      => 0,
            ];
        }

        $totals[$key]['impressions'] += (int) $row->getMetrics()->getImpressions();
        $totals[$key]['clicks']      += (int) $row->getMetrics()->getClicks();
    }

    foreach ($totals as $data) {

        GoogleAdsDemographic::updateOrCreate(
            [
                'ads_account_id' => $this->property->id,
                'campaign_id'    => $data['campaign_id'], // ✅ FIX
                'type'           => 'gender',
                'value'          => $data['gender'],
                'date'           => $data['date'],
            ],
            [
                'impressions' => $data['impressions'],
                'clicks'      => $data['clicks'],
            ]
        );
    }
}
/*   age  */

  protected function fetchAge(GoogleAdsService $service)
{
    $where = "segments.date BETWEEN '{$this->startDate}' AND '{$this->endDate}'";

    $query = "
        SELECT
            segments.date,
            campaign.id, -- ✅ REQUIRED
            ad_group_criterion.age_range.type,
            metrics.impressions,
            metrics.clicks
        FROM age_range_view
        WHERE {$where}
    ";

    $response = $service->query(
        $this->googleAccount,
        $this->customerId,
        $query,
        $this->loginCustomerId
    );

    $totals = [];

    foreach ($response->getIterator() as $row) {

        if (!$row->getAdGroupCriterion() || !$row->getMetrics() || !$row->getCampaign()) continue;

        $date = $row->getSegments()->getDate();
        if (!$date) continue;

        $campaignId = $row->getCampaign()->getId(); // ✅ REQUIRED

        $ageEnum = $row->getAdGroupCriterion()->getAgeRange()->getType();
        $age = $this->formatAge($ageEnum);

        // ✅ FIXED KEY (campaign + age + date)
        $key = $campaignId . '_' . $age . '_' . $date;

        if (!isset($totals[$key])) {
            $totals[$key] = [
                'campaign_id' => $campaignId,
                'age'         => $age,
                'date'        => $date,
                'impressions' => 0,
                'clicks'      => 0,
            ];
        }

        $totals[$key]['impressions'] += (int) $row->getMetrics()->getImpressions();
        $totals[$key]['clicks']      += (int) $row->getMetrics()->getClicks();
    }

    foreach ($totals as $data) {

        GoogleAdsDemographic::updateOrCreate(
            [
                'ads_account_id' => $this->property->id,
                'campaign_id'    => $data['campaign_id'], // ✅ FIX
                'type'           => 'age',
                'value'          => $data['age'],
                'date'           => $data['date'],
            ],
            [
                'impressions' => $data['impressions'],
                'clicks'      => $data['clicks'],
            ]
        );
    }
}
    /*
    |--------------------------------------------------------------------------
    | DEVICES
    |--------------------------------------------------------------------------
    */
      
     protected function fetchCampaignDeviceMetrics($service)
            {
                $where = "segments.date BETWEEN '{$this->startDate}' AND '{$this->endDate}'";

                $query = "
                    SELECT
                        segments.date,
                        campaign.id,
                        segments.device,
                        metrics.impressions,
                        metrics.clicks
                    FROM campaign
                    WHERE {$where}
                ";

                $response = $service->query(
                    $this->googleAccount,
                    $this->customerId,
                    $query,
                    $this->loginCustomerId
                );

                $totals = [];

                foreach ($response->iterateAllElements() as $row) {

                    if (!$row->getCampaign() || !$row->getMetrics() || !$row->getSegments()) continue;

                    $date = $row->getSegments()->getDate();
                    if (!$date) continue;

                    $campaignId = $row->getCampaign()->getId();

                    $deviceEnum = $row->getSegments()->getDevice();
                    $device = $deviceEnum !== null ? Device::name($deviceEnum) : 'UNKNOWN';

                    $key = $campaignId . '_' . $device . '_' . $date;

                    if (!isset($totals[$key])) {
                        $totals[$key] = [
                            'campaign_id' => $campaignId,
                            'device' => $device,
                            'date' => $date,
                            'impressions' => 0,
                            'clicks' => 0,
                        ];
                    }

                    $totals[$key]['impressions'] += (int) $row->getMetrics()->getImpressions();
                    $totals[$key]['clicks'] += (int) $row->getMetrics()->getClicks();
                }

                foreach ($totals as $data) {

                    \App\Models\GoogleAdsCampaignDeviceMetric::updateOrCreate( // ✅ FIXED MODEL
                        [
                            'ads_account_id' => $this->property->id,
                            'campaign_id'    => $data['campaign_id'],
                            'device'         => $data['device'],
                            'date'           => $data['date'],
                        ],
                        [
                            'impressions' => $data['impressions'],
                            'clicks'      => $data['clicks'],
                        ]
                    );
                }
            }


           protected function fetchCalls(GoogleAdsService $service)
{
    $where = $this->getCallDateRange();

    $query = "
        SELECT
            call_view.start_call_date_time,
            call_view.call_status,
            campaign.id -- ✅ REQUIRED
        FROM call_view
        WHERE {$where}
    ";

    $response = $service->query(
        $this->googleAccount,
        $this->customerId,
        $query,
        $this->loginCustomerId
    );

    $totals = [];

    foreach ($response->iterateAllElements() as $row) {

        $callView = $row->getCallView();
        $campaign = $row->getCampaign();

        if (!$callView || !$campaign) continue;

        $dateTime = $callView->getStartCallDateTime();
        if (!$dateTime) continue;

        $date = \Carbon\Carbon::parse($dateTime)->format('Y-m-d');

        $campaignId = $campaign->getId(); // ✅ ADD

        $status = (int) $callView->getCallStatus();

        if ($status !== 3) continue;

        // ✅ FIXED KEY (campaign + date)
        $key = $campaignId . '_' . $date;

        $totals[$key] = [
            'campaign_id' => $campaignId,
            'date'        => $date,
            'total_calls' => ($totals[$key]['total_calls'] ?? 0) + 1,
        ];
    }

    $data = [];

    foreach ($totals as $row) {
        $data[] = [
            'ads_account_id' => $this->property->id,
            'campaign_id'    => $row['campaign_id'], // ✅ FIX
            'date'           => $row['date'],
            'total_calls'    => $row['total_calls'],
            'created_at'     => now(),
            'updated_at'     => now(),
        ];
    }

    if (!empty($data)) {
        GoogleAdsCall::upsert(
            $data,
            ['ads_account_id', 'campaign_id', 'date'], // ✅ FIX
            ['total_calls', 'updated_at']
        );
    }
}
    }