<?php

namespace App\Services;

use App\Models\GoogleAccount;
use App\Models\GoogleServiceProperty;
use App\Models\Ga4Metric;
use Carbon\Carbon;
use Google_Service_AnalyticsData;
use Google_Service_AnalyticsData_RunReportRequest;
use Illuminate\Support\Facades\Log;

class Ga4Service
{
        // public function syncAccount(GoogleAccount $account): void
        // {
        //     if ($account->type !== 'analytics') {
        //         return;
        //     }
        //     $auth = app(\App\Services\GoogleAuthService::class);
        //     $client = app(GoogleAuthService::class)->clientForAccount($account);
        //     $analytics = new Google_Service_AnalyticsData($client);
        //     $properties = GoogleServiceProperty::where([
        //         'google_account_id' => $account->id,
        //         'service_type' => 'analytics',
        //     ])->get();

        //     foreach ($properties as $property) {
        //         $this->syncProperty($analytics, $property);
        //     }
        // }

            // protected function syncProperty( Google_Service_AnalyticsData $analytics,GoogleServiceProperty $property ): void {

            //     $propertyId = $property->metadata['property_id'];
            //       if (!$property->last_synced_at) {
            //           $startDate = '365daysAgo';
            //         } else {
            //             $startDate = \Carbon\Carbon::parse($property->last_synced_at)
            //                 ->addDay()
            //                 ->toDateString();
            //         }
            //         $endDate = now()->subDay()->toDateString();
            //         if (\Carbon\Carbon::parse($startDate)->gt(\Carbon\Carbon::parse($endDate))) {
            //             return;
            //         }
            //     $latestDates[] = $this->syncOverview($analytics, $property, $propertyId, $startDate, $endDate);
            //     $latestDates[] = $this->syncTimeSeries($analytics, $property, $propertyId, $startDate, $endDate);
            //     $latestDates[] = $this->syncChannels($analytics, $property, $propertyId, $startDate, $endDate);
            //     $latestDates[] = $this->syncPages($analytics, $property, $propertyId, $startDate, $endDate);
            //     $latestDates[] = $this->syncEvents($analytics, $property, $propertyId, $startDate, $endDate);
            //     $latestDates[] = $this->syncDevices($analytics, $property, $propertyId, $startDate, $endDate);
            //     $latestDates[] = $this->syncLocations($analytics, $property, $propertyId, $startDate, $endDate);
            //     $latestDates[] = $this->syncReferrers($analytics, $property, $propertyId, $startDate, $endDate);
            //     $latestDates[] = $this->syncMonthlyOverview($analytics, $property, $propertyId, $startDate, $endDate);
            //     $latestDates[] = $this->syncChannelMonthly($analytics, $property, $propertyId, $startDate, $endDate);
            //     $latestDates = array_filter($latestDates);
            
            //     if (!empty($latestDates)) {
            //         $maxDate = max($latestDates);
            //         $property->update([
            //             'last_synced_at' => $maxDate
            //         ]);
            //     }
            // }

            public function syncSingleProperty($property): void
            {
                $client = app(GoogleAuthService::class)->clientForAccount($property->account);
                $analytics = new \Google_Service_AnalyticsData($client);

                $propertyId = $property->metadata['property_id'];

                $startDate = !$property->last_synced_at
                    ? '365daysAgo'
                    : \Carbon\Carbon::parse($property->last_synced_at)->addDay()->toDateString();

                $endDate = now()->subDay()->toDateString();

                if (\Carbon\Carbon::parse($startDate)->gt(\Carbon\Carbon::parse($endDate))) {
                    return;
                }

                $latestDates = [];

                $latestDates[] = $this->syncOverview($analytics, $property, $propertyId, $startDate, $endDate);
                $latestDates[] = $this->syncTimeSeries($analytics, $property, $propertyId, $startDate, $endDate);
                $latestDates[] = $this->syncChannels($analytics, $property, $propertyId, $startDate, $endDate);
                $latestDates[] = $this->syncPages($analytics, $property, $propertyId, $startDate, $endDate);
                $latestDates[] = $this->syncEvents($analytics, $property, $propertyId, $startDate, $endDate);
                $latestDates[] = $this->syncDevices($analytics, $property, $propertyId, $startDate, $endDate);
                $latestDates[] = $this->syncLocations($analytics, $property, $propertyId, $startDate, $endDate);
                $latestDates[] = $this->syncReferrers($analytics, $property, $propertyId, $startDate, $endDate);
                $latestDates[] = $this->syncMonthlyOverview($analytics, $property, $propertyId, $startDate, $endDate);
                $latestDates[] = $this->syncChannelMonthly($analytics, $property, $propertyId, $startDate, $endDate);

                $latestDates = array_filter($latestDates);

                if (!empty($latestDates)) {
                    $property->update([
                        'last_synced_at' => max($latestDates)
                    ]);
                }
            }

                        


        protected function syncOverview($analytics, $property, $propertyId, $startDate, $endDate)
        {
            $response = $analytics->properties->runReport(
                "properties/{$propertyId}",
                new \Google_Service_AnalyticsData_RunReportRequest([
                    'dateRanges' => [
                        [
                            'startDate' => $startDate,
                            'endDate'   => $endDate
                        ]
                    ],
                    'dimensions' => [
                        ['name' => 'date']
                    ],
                    'metrics' => [
                        ['name' => 'sessions'],
                        ['name' => 'engagedSessions'],
                        ['name' => 'screenPageViews'],
                        ['name' => 'totalUsers'],
                        ['name' => 'engagementRate'],
                    ],
                ])
            );
            $latestDate = null;
            foreach ($response->getRows() ?? [] as $row) {
                // ✅ Convert GA date (20250602 → 2025-06-02)
                $metricDate = \Carbon\Carbon::createFromFormat(
                    'Ymd',
                    $row->dimensionValues[0]->value
                )->toDateString();
               if (!$latestDate || $metricDate > $latestDate) {
                    $latestDate = $metricDate;
                }
                \App\Models\Ga4Metric::updateOrCreate(
                        [
                            'google_service_property_id' => $property->id,
                            'report_type' => 'overview',
                            'metric_date' => $metricDate,
                            'dimension_name' => 'overview',
                            'dimension_value' => 'total',
                        ],
                        [
                            'sessions' => (int) ($row->metricValues[0]->value ?? 0),
                            'engaged_sessions' => (int) ($row->metricValues[1]->value ?? 0),
                            'views' => (int) ($row->metricValues[2]->value ?? 0),
                            'users' => (int) ($row->metricValues[3]->value ?? 0),
                            'engagement_rate' => round(
                                ((float) ($row->metricValues[4]->value ?? 0)) * 100,
                                2
                            ),
                        ]
                );
            }
            return $latestDate;
        }

        protected function syncTimeSeries($analytics, $property, $propertyId, $startDate, $endDate)
        {
            $response = $analytics->properties->runReport(
                "properties/{$propertyId}",
                new \Google_Service_AnalyticsData_RunReportRequest([
                    'dateRanges' => [
                         [
                            'startDate' => $startDate,
                            'endDate'   => $endDate
                        ]
                    ],
                    'dimensions' => [
                        ['name' => 'date']
                    ],
                    'metrics' => [
                        ['name' => 'sessions'],
                        ['name' => 'screenPageViews'],
                    ],
                ])
            );
             $latestDate = null;
            foreach ($response->getRows() ?? [] as $row) {
                $metricDate = \Carbon\Carbon::createFromFormat(
                    'Ymd',
                    $row->dimensionValues[0]->value
                )->toDateString();
                
               if (!$latestDate || $metricDate > $latestDate) {
                    $latestDate = $metricDate;
                }
                \App\Models\Ga4Metric::updateOrCreate(
                    [
                        'google_service_property_id' => $property->id,
                        'report_type' => 'timeseries',
                        'metric_date' => $metricDate,
                        'dimension_name' => 'timeseries',     // ✅ added
                        'dimension_value' => 'timeseries',    // ✅ added
                    ],
                    [
                        'sessions' => (int) ($row->metricValues[0]->value ?? 0),
                        'views'    => (int) ($row->metricValues[1]->value ?? 0),
                    ]
                );
            }
              return $latestDate;
        }


       protected function syncChannels($analytics, $property, $propertyId, $startDate, $endDate)
        {
            $response = $analytics->properties->runReport(
                "properties/{$propertyId}",
                new \Google_Service_AnalyticsData_RunReportRequest([
                    'dateRanges' => [[
                            'startDate' => $startDate,
                            'endDate'   => $endDate
                        ]],
                    'dimensions' => [
                        ['name' => 'date'],
                        ['name' => 'sessionDefaultChannelGroup'],
                    ],
                    'metrics' => [
                        ['name' => 'sessions'],
                        ['name' => 'totalUsers'],
                        ['name' => 'screenPageViews'],
                    ],
                    'orderBys' => [
                        [
                            'metric' => ['metricName' => 'sessions'],
                            'desc'   => true,
                        ],
                    ],
                ])
            );
            $latestDate = null;
            foreach ($response->getRows() ?? [] as $row) {

                // ✅ Extract date & channel correctly
                $metricDate = \Carbon\Carbon::createFromFormat(
                    'Ymd',
                    $row->dimensionValues[0]->value
                )->toDateString();
                if (!$latestDate || $metricDate > $latestDate) {
                    $latestDate = $metricDate;
                }
                $channel = $row->dimensionValues[1]->value ?: '(not set)';

                \App\Models\Ga4Metric::updateOrCreate(
                        [
                            'google_service_property_id' => $property->id,
                            'report_type'    => 'channel',
                            'metric_date'    => $metricDate,
                            'dimension_name' => 'channel',       // ✅ FIX
                            'dimension_value'=> $channel,        // ✅ FIX
                        ],
                        [
                            'sessions' => (int) ($row->metricValues[0]->value ?? 0),
                            'users'    => (int) ($row->metricValues[1]->value ?? 0),
                            'views'    => (int) ($row->metricValues[2]->value ?? 0),
                        ]
                );
            }
            return $latestDate;
        }


          protected function syncPages($analytics, $property, $propertyId, $startDate, $endDate)
            {
                $response = $analytics->properties->runReport(
                    "properties/{$propertyId}",
                    new \Google_Service_AnalyticsData_RunReportRequest([
                        'dateRanges' => [[
                            'startDate' => $startDate,
                            'endDate'   => $endDate
                        ]],
                        'dimensions' => [
                            ['name' => 'date'],
                            ['name' => 'pagePathPlusQueryString'],
                        ],
                        'metrics' => [
                            ['name' => 'sessions'],
                            ['name' => 'totalUsers'],
                            ['name' => 'engagedSessions'],
                            ['name' => 'screenPageViews'],
                            ['name' => 'userEngagementDuration'],
                        ],
                        'limit' => 1000,
                    ])
                );

                $latestDate = null;

                foreach ($response->getRows() ?? [] as $row) {

                    $metricDate = \Carbon\Carbon::createFromFormat(
                        'Ymd',
                        $row->dimensionValues[0]->value
                    )->toDateString();

                    if (!$latestDate || $metricDate > $latestDate) {
                        $latestDate = $metricDate;
                    }

                    // ✅ Clean page path
                    $pagePathRaw = $row->dimensionValues[1]->value ?? '/';
                    $pagePath = strtok($pagePathRaw, '?') ?: '/';

                    // ✅ Skip unwanted URLs
                    if (
                        str_contains($pagePath, 'elementor-preview') ||
                        str_contains($pagePath, 'customize_') ||
                        str_contains($pagePath, 'preview=')
                    ) {
                        continue;
                    }

                    // ✅ Prevent long string crash
                    $pagePath = substr($pagePath, 0, 255);

                    \App\Models\Ga4Metric::updateOrCreate(
                        [
                            'google_service_property_id' => $property->id,
                            'report_type'    => 'page',
                            'metric_date'    => $metricDate,
                            'dimension_name' => 'page',        // ✅ FIX
                            'dimension_value'=> $pagePath,     // ✅ FIX
                        ],
                        [
                            'sessions'         => (int) ($row->metricValues[0]->value ?? 0),
                            'users'            => (int) ($row->metricValues[1]->value ?? 0),
                            'engaged_sessions' => (int) ($row->metricValues[2]->value ?? 0),
                            'views'            => (int) ($row->metricValues[3]->value ?? 0),
                            'avg_engagement_time' => (int) ($row->metricValues[4]->value ?? 0),
                        ]
                    );
                }

                return $latestDate;
            }

        protected function syncEvents($analytics, $property, $propertyId, $startDate, $endDate)
        {
            $response = $analytics->properties->runReport(
                "properties/{$propertyId}",
                new \Google_Service_AnalyticsData_RunReportRequest([
                    'dateRanges' => [
                        [
                            'startDate' => $startDate,
                            'endDate'   => $endDate
                        ]
                    ],
                    'dimensions' => [
                        ['name' => 'date'],
                        ['name' => 'eventName'],
                    ],
                    'metrics' => [
                        ['name' => 'sessions'],
                        ['name' => 'eventCount'],
                    ],
                    'limit' => 500,
                ])
            );

            $latestDate = null;
            $rows = $response->getRows() ?? [];

            foreach ($rows as $row) {

                $dimensionValues = $row->getDimensionValues() ?? [];
                $metricValues    = $row->getMetricValues() ?? [];

                // ✅ Date
                $metricDate = isset($dimensionValues[0])
                    ? \Carbon\Carbon::createFromFormat('Ymd', $dimensionValues[0]->getValue())->toDateString()
                    : null;

                if (!$metricDate) continue;

                if (!$latestDate || $metricDate > $latestDate) {
                    $latestDate = $metricDate;
                }

                // ✅ Event name (safe + limited)
                $eventName = isset($dimensionValues[1])
                    ? ($dimensionValues[1]->getValue() ?: '(not set)')
                    : '(not set)';

                $eventName = substr($eventName, 0, 255); // prevent DB overflow

                // 🚫 Optional: skip junk data
                if (str_starts_with($eventName, '/data:text')) {
                    continue;
                }

                // ✅ Metrics
                $sessions   = isset($metricValues[0]) ? (int) $metricValues[0]->getValue() : 0;
                $eventCount = isset($metricValues[1]) ? (int) $metricValues[1]->getValue() : 0;

                \App\Models\Ga4Metric::updateOrCreate(
                    [
                        'google_service_property_id' => $property->id,
                        'report_type'                => 'event',
                        'metric_date'                => $metricDate,
                        'dimension_name'             => 'event',       // ✅ FIX
                        'dimension_value'            => $eventName,    // ✅ FIX
                    ],
                    [
                        'sessions'    => $sessions,
                        'event_count' => $eventCount,
                    ]
                );
            }

            return $latestDate;
        }


    protected function syncDevices($analytics, $property, $propertyId, $startDate, $endDate)
        {
            $response = $analytics->properties->runReport(
                "properties/{$propertyId}",
                new \Google_Service_AnalyticsData_RunReportRequest([
                    'dateRanges' => [[
                        'startDate' => $startDate,
                        'endDate'   => $endDate
                    ]],
                    'dimensions' => [
                        ['name' => 'date'],
                        ['name' => 'deviceCategory'],
                        ['name' => 'deviceModel'],
                    ],
                    'metrics' => [
                        ['name' => 'sessions'],
                        ['name' => 'screenPageViews'],
                        ['name' => 'totalUsers'],
                        ['name' => 'engagedSessions'],
                        ['name' => 'userEngagementDuration'],
                        ['name' => 'engagementRate'],
                        ['name' => 'eventCount'],
                    ],
                ])
            );

            $latestDate = null;

            foreach ($response->getRows() ?? [] as $row) {

                // ✅ Date
                $metricDate = \Carbon\Carbon::createFromFormat(
                    'Ymd',
                    $row->dimensionValues[0]->value
                )->toDateString();

                if (!$latestDate || $metricDate > $latestDate) {
                    $latestDate = $metricDate;
                }

                // ✅ Device category
                $deviceCategory = strtolower($row->dimensionValues[1]->value ?? '(not set)');

                // ✅ Device model
                $deviceModel = $row->dimensionValues[2]->value ?? '(not set)';

                // ✅ Combine (IMPORTANT FIX)
                $dimensionValue = $deviceCategory . ' | ' . $deviceModel;

                // prevent long string crash
                $dimensionValue = substr($dimensionValue, 0, 255);

                // optional: skip junk
                if (str_starts_with($dimensionValue, '/data:text')) {
                    continue;
                }

                \App\Models\Ga4Metric::updateOrCreate(
                    [
                        'google_service_property_id' => $property->id,
                        'report_type'    => 'device',
                        'metric_date'    => $metricDate,
                        'dimension_name' => 'device',            // ✅ FIX
                        'dimension_value'=> $dimensionValue,     // ✅ FIX
                    ],
                    [
                        'sessions'           => (int) ($row->metricValues[0]->value ?? 0),
                        'views'              => (int) ($row->metricValues[1]->value ?? 0),
                        'users'              => (int) ($row->metricValues[2]->value ?? 0),
                        'engaged_sessions'   => (int) ($row->metricValues[3]->value ?? 0),
                        'avg_engagement_time'=> (int) ($row->metricValues[4]->value ?? 0),
                        'engagement_rate'    => round(
                            ((float) ($row->metricValues[5]->value ?? 0)) * 100,
                            2
                        ),
                        'event_count'        => (int) ($row->metricValues[6]->value ?? 0),
                        'extra' => json_encode([
                            'device_model' => $deviceModel,
                        ]),
                    ]
                );
            }

            return $latestDate;
        }


         protected function syncLocations($analytics, $property, $propertyId, $startDate, $endDate)
            {
                $response = $analytics->properties->runReport(
                    "properties/{$propertyId}",
                    new \Google_Service_AnalyticsData_RunReportRequest([
                        'dateRanges' => [[
                            'startDate' => $startDate,
                            'endDate'   => $endDate
                        ]],
                        'dimensions' => [
                            ['name' => 'date'],
                            ['name' => 'country'],
                            ['name' => 'region'],
                            ['name' => 'city'],
                        ],
                        'metrics' => [
                            ['name' => 'sessions'],
                            ['name' => 'screenPageViews'],
                            ['name' => 'totalUsers'],
                            ['name' => 'engagedSessions'],
                            ['name' => 'engagementRate'],
                            ['name' => 'eventCount'],
                            ['name' => 'userEngagementDuration'],
                        ],
                        'limit' => 2000,
                    ])
                );

                $latestDate = null;

                foreach ($response->getRows() ?? [] as $row) {

                    // ✅ Date
                    $metricDate = \Carbon\Carbon::createFromFormat(
                        'Ymd',
                        $row->dimensionValues[0]->value
                    )->toDateString();

                    if (!$latestDate || $metricDate > $latestDate) {
                        $latestDate = $metricDate;
                    }

                    // ✅ Clean location values
                    $country = trim($row->dimensionValues[1]->value ?? '(not set)');
                    $region  = trim($row->dimensionValues[2]->value ?? '(not set)');
                    $city    = trim($row->dimensionValues[3]->value ?? '(not set)');

                    // ✅ Skip empty junk rows
                    if ($country === '(not set)' && $region === '(not set)' && $city === '(not set)') {
                        continue;
                    }

                    // ✅ Build dimension value safely
                    $dimensionValue = "{$country}|{$region}|{$city}";

                    // 🚨 Prevent DB overflow (VERY IMPORTANT)
                    $dimensionValue = substr($dimensionValue, 0, 255);

                    // 🚫 Skip bad injected data
                    if (str_starts_with($dimensionValue, '/data:text')) {
                        continue;
                    }

                    \App\Models\Ga4Metric::updateOrCreate(
                        [
                            'google_service_property_id' => $property->id,
                            'report_type'    => 'location',
                            'metric_date'    => $metricDate,
                            'dimension_name' => 'location',
                            'dimension_value'=> $dimensionValue, // ✅ already correct
                        ],
                        [
                            'sessions'            => (int) ($row->metricValues[0]->value ?? 0),
                            'views'               => (int) ($row->metricValues[1]->value ?? 0),
                            'users'               => (int) ($row->metricValues[2]->value ?? 0),
                            'engaged_sessions'    => (int) ($row->metricValues[3]->value ?? 0),
                            'engagement_rate'     => round(((float) ($row->metricValues[4]->value ?? 0)) * 100, 2),
                            'event_count'         => (int) ($row->metricValues[5]->value ?? 0),
                            'avg_engagement_time' => (int) ($row->metricValues[6]->value ?? 0),
                        ]
                    );
                }

                return $latestDate;
            }

           protected function syncReferrers($analytics, $property, $propertyId, $startDate, $endDate)
            {
                $response = $analytics->properties->runReport(
                    "properties/{$propertyId}",
                    new \Google_Service_AnalyticsData_RunReportRequest([
                        'dateRanges' => [[
                            'startDate' => $startDate,
                            'endDate'   => $endDate
                        ]],
                        'dimensions' => [
                            ['name' => 'date'],
                            ['name' => 'sessionSource'],
                            ['name' => 'sessionDefaultChannelGrouping'],
                        ],
                        'metrics' => [
                            ['name' => 'sessions'],
                            ['name' => 'totalUsers'],
                            ['name' => 'newUsers'],
                        ],
                        'dimensionFilter' => [
                            'andGroup' => [
                                'expressions' => [
                                    [
                                        'filter' => [
                                            'fieldName' => 'sessionDefaultChannelGrouping',
                                            'stringFilter' => [
                                                'matchType' => 'EXACT',
                                                'value' => 'Referral',
                                            ],
                                        ],
                                    ],
                                    [
                                        'notExpression' => [
                                            'filter' => [
                                                'fieldName' => 'sessionSource',
                                                'stringFilter' => [
                                                    'matchType' => 'CONTAINS',
                                                    'value' => 'google',
                                                ],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ])
                );

                $latestDate = null;

                foreach ($response->getRows() ?? [] as $row) {

                    $metricDate = \Carbon\Carbon::createFromFormat(
                        'Ymd',
                        $row->dimensionValues[0]->value
                    )->toDateString();

                    if (!$latestDate || $metricDate > $latestDate) {
                        $latestDate = $metricDate;
                    }

                    // ✅ Source + channel
                    $source  = $row->dimensionValues[1]->value ?? '(not set)';
                    $channel = $row->dimensionValues[2]->value ?? 'Referral';

                    // ✅ Combine for uniqueness (IMPORTANT FIX)
                    $dimensionValue = $source . ' | ' . $channel;

                    // prevent long string crash
                    $dimensionValue = substr($dimensionValue, 0, 255);

                    // skip junk
                    if (str_starts_with($dimensionValue, '/data:text')) {
                        continue;
                    }

                    \App\Models\Ga4Metric::updateOrCreate(
                        [
                            'google_service_property_id' => $property->id,
                            'report_type'    => 'referrer',
                            'metric_date'    => $metricDate,
                            'dimension_name' => 'referrer',         // ✅ FIX
                            'dimension_value'=> $dimensionValue,    // ✅ FIX
                        ],
                        [
                            'sessions'    => (int) ($row->metricValues[0]->value ?? 0),
                            'users'       => (int) ($row->metricValues[1]->value ?? 0),
                            'event_count' => (int) ($row->metricValues[2]->value ?? 0),
                            'extra' => json_encode([
                                'source'  => $source,
                                'channel' => $channel,
                            ]),
                        ]
                    );
                }

                return $latestDate;
            }
        protected function syncMonthlyOverview($analytics, $property, $propertyId, $startDate, $endDate)
        {
            $response = $analytics->properties->runReport(
                "properties/{$propertyId}",
                new \Google_Service_AnalyticsData_RunReportRequest([
                    'dateRanges' => [
                        [
                            'startDate' => $startDate,
                            'endDate'   => $endDate
                        ]
                    ],
                    'dimensions' => [
                        ['name' => 'yearMonth']
                    ],
                    'metrics' => [
                        ['name' => 'sessions'],
                        ['name' => 'newUsers'],
                        ['name' => 'totalUsers'],
                    ],
                    'orderBys' => [
                        [
                            'dimension' => ['dimensionName' => 'yearMonth'],
                            'desc' => false
                        ]
                    ]
                ])
            );

            $latestDate = null;

            foreach ($response->getRows() ?? [] as $row) {

                // ✅ Convert 202506 → 2025-06-01
                $metricDate = \Carbon\Carbon::createFromFormat(
                    'Ym',
                    $row->dimensionValues[0]->value
                )->startOfMonth()->toDateString();

                if (!$latestDate || $metricDate > $latestDate) {
                    $latestDate = $metricDate;
                }

                \App\Models\Ga4Metric::updateOrCreate(
                    [
                        'google_service_property_id' => $property->id,
                        'report_type' => 'monthly_overview',
                        'metric_date' => $metricDate,
                        'dimension_name' => 'monthly_overview',     // ✅ FIX
                        'dimension_value' => 'monthly_overview',    // ✅ FIX
                    ],
                    [
                        'sessions' => (int) ($row->metricValues[0]->value ?? 0),
                        'users'    => (int) ($row->metricValues[2]->value ?? 0),
                        'extra'    => json_encode([
                            'new_users' => (int) ($row->metricValues[1]->value ?? 0),
                        ]),
                    ]
                );
            }

            return $latestDate;
        }


            protected function syncChannelMonthly($analytics, $property, $propertyId, $startDate, $endDate)
            {
                $response = $analytics->properties->runReport(
                    "properties/{$propertyId}",
                    new \Google_Service_AnalyticsData_RunReportRequest([
                        'dateRanges' => [[
                            'startDate' => $startDate,
                            'endDate'   => $endDate
                        ]],
                        'dimensions' => [
                            ['name' => 'sessionDefaultChannelGroup'],
                            ['name' => 'yearMonth'],
                        ],
                        'metrics' => [
                            ['name' => 'sessions'],
                            ['name' => 'totalUsers'],
                            ['name' => 'screenPageViews'],
                        ],
                        'orderBys' => [
                            [
                                'dimension' => ['dimensionName' => 'yearMonth'],
                                'desc' => false,
                            ],
                        ],
                    ])
                );

                $latestDate = null;

                foreach ($response->getRows() ?? [] as $row) {

                    $channel = $row->dimensionValues[0]->value ?? '(not set)';
                    $yearMonth = $row->dimensionValues[1]->value ?? null;

                    if (!$yearMonth) continue;

                    // ✅ Convert YYYYMM → YYYY-MM-01
                    $metricDate = \Carbon\Carbon::createFromFormat('Ym', $yearMonth)
                        ->startOfMonth()
                        ->toDateString();

                    if (!$latestDate || $metricDate > $latestDate) {
                        $latestDate = $metricDate;
                    }

                    // ✅ Prevent long string crash
                    $channel = substr($channel, 0, 255);

                    // 🚫 Skip junk
                    if (str_starts_with($channel, '/data:text')) {
                        continue;
                    }

                    \App\Models\Ga4Metric::updateOrCreate(
                        [
                            'google_service_property_id' => $property->id,
                            'report_type'    => 'channel_monthly',
                            'metric_date'    => $metricDate,
                            'dimension_name' => 'channel',
                            'dimension_value'=> $channel,   // ✅ already correct
                        ],
                        [
                            'sessions' => (int) ($row->metricValues[0]->value ?? 0),
                            'users'    => (int) ($row->metricValues[1]->value ?? 0),
                            'views'    => (int) ($row->metricValues[2]->value ?? 0),
                        ]
                    );
                }

                return $latestDate;
            }
}
