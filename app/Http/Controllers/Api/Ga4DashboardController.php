<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ga4Metric;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Reports\DashboardController;
use Carbon\Carbon;

class Ga4DashboardController extends Controller
{


        private function allowedPropertyIds(?int $clientId, ?int $groupId)
        {
            $query = \App\Models\GoogleServiceProperty::query()
                ->where('service_type', 'analytics')
                ->where('is_assigned', 1);
            if ($clientId) {
                $query->where('client_id', $clientId);
            }
            elseif ($groupId) {
                $clientIds = DB::table('client_client_group')
                    ->where('client_group_id', $groupId)
                    ->pluck('client_id');
                $query->whereIn('client_id', $clientIds);
            }
            return $query->pluck('id');
        }

        private function resolveDateRange(Request $request): array
        {
            $range = $request->query('range', '7');

            $dashboard = new DashboardController();
            $dates = $dashboard->getDateRange($range);

            return [
                'start' => $dates['currentStart'],
                'end'   => $dates['currentEnd'],
                'previousStart' => $dates['previousStart'],
                'previousEnd' => $dates['previousEnd'],
            ];
        }

    public function overview(Request $request)
    {
        $clientId = $request->client_id;
        $groupId  = $request->group_id;

        $range = $this->resolveDateRange($request);
        $propertyIds = $this->allowedPropertyIds($clientId, $groupId);

        // ✅ CURRENT DATA
        $current = \App\Models\Ga4Metric::whereIn('google_service_property_id', $propertyIds)
            ->where('report_type', 'overview')
            ->whereBetween('metric_date', [$range['start'], $range['end']])
            ->selectRaw('
                SUM(sessions) as sessions,
                SUM(engaged_sessions) as engaged_sessions,
                SUM(users) as users,
                SUM(views) as views
            ')
            ->first();

        // ✅ PREVIOUS DATA
        $previous = \App\Models\Ga4Metric::whereIn('google_service_property_id', $propertyIds)
            ->where('report_type', 'overview')
            ->whereBetween('metric_date', [$range['previousStart'], $range['previousEnd']])
            ->selectRaw('
                SUM(sessions) as sessions,
                SUM(engaged_sessions) as engaged_sessions,
                SUM(users) as users,
                SUM(views) as views
            ')
            ->first();

        // ✅ Engagement Rate
        $currentEngagement = $current->sessions > 0
            ? ($current->engaged_sessions / $current->sessions) * 100
            : 0;

        $previousEngagement = $previous->sessions > 0
            ? ($previous->engaged_sessions / $previous->sessions) * 100
            : 0;

        // ✅ Helper for % change
        $calcChange = function ($current, $previous) {
            if ($previous == 0) return 0;
            return round((($current - $previous) / $previous) * 100, 2);
        };

        return response()->json([
            'overview' => [
                'sessions' => (int) $current->sessions,
                'sessions_prev' => (int) $previous->sessions,
                'sessions_change' => $calcChange($current->sessions, $previous->sessions),

                'engaged_sessions' => (int) $current->engaged_sessions,
                'engaged_sessions_prev' => (int) $previous->engaged_sessions,
                'engaged_sessions_change' => $calcChange($current->engaged_sessions, $previous->engaged_sessions),

                'users' => (int) $current->users,
                'users_prev' => (int) $previous->users,
                'users_change' => $calcChange($current->users, $previous->users),

                'views' => (int) $current->views,
                'views_prev' => (int) $previous->views,
                'views_change' => $calcChange($current->views, $previous->views),

                'engagement_rate' => round($currentEngagement, 2),
                'engagement_rate_prev' => round($previousEngagement, 2),
                'engagement_rate_change' => $calcChange($currentEngagement, $previousEngagement),
            ]
        ]);
    }


        public function timeSeries(Request $request)
        {
            $propertyIds = $this->allowedPropertyIds(
                $request->client_id,
                $request->group_id
            );
           $range = $this->resolveDateRange($request);
            return Ga4Metric::whereIn('google_service_property_id', $propertyIds)
                ->where('report_type', 'timeseries')
                ->whereBetween('metric_date', [$range['start'], $range['end']])
                ->orderBy('metric_date')
                ->get([
                    'metric_date',
                    'sessions',
                    'views',
                ]);
        }


                public function channels(Request $request)
                {
                    $propertyIds = $this->allowedPropertyIds(
                        $request->client_id,
                        $request->group_id
                    );

                    $range = $this->resolveDateRange($request);
                    return Ga4Metric::whereIn('google_service_property_id', $propertyIds)
                        ->where('report_type', 'channel')
                        ->whereBetween('metric_date', [$range['start'], $range['end']])
                        ->orderByDesc('sessions')
                        ->get();
                }


            public function pages(Request $request)
            {
                $propertyIds = $this->allowedPropertyIds(
                    $request->client_id,
                    $request->group_id
                );

                $range = $this->resolveDateRange($request);

                return \App\Models\Ga4Metric::whereIn('google_service_property_id', $propertyIds)
                    ->where('report_type', 'page')
                    ->whereBetween('metric_date', [$range['start'], $range['end']])
                    ->orderByDesc('views')
                    ->get();
            }



            public function events(Request $request)
            {
                $propertyIds = $this->allowedPropertyIds(
                    $request->client_id,
                    $request->group_id
                );

                // ✅ Only date filtering
                $range = $this->resolveDateRange($request);

                return \App\Models\Ga4Metric::whereIn('google_service_property_id', $propertyIds)
                    ->where('report_type', 'event')
                    ->whereBetween('metric_date', [$range['start'], $range['end']])
                    ->orderByDesc('event_count')
                    ->get();
            }


            public function devices(Request $request)
            {
                $propertyIds = $this->allowedPropertyIds(
                    $request->client_id,
                    $request->group_id
                );

                $range = $this->resolveDateRange($request);

                return Ga4Metric::whereIn('google_service_property_id', $propertyIds)
                    ->where('report_type', 'device')
                    ->whereBetween('metric_date', [$range['start'], $range['end']])
                    ->get();
            }


        public function locations(Request $request)
        {
            $propertyIds = $this->allowedPropertyIds(
                $request->client_id,
                $request->group_id
            );

            // ✅ Only date filtering
            $range = $this->resolveDateRange($request);

            return Ga4Metric::whereIn('google_service_property_id', $propertyIds)
                ->where('report_type', 'location')
                ->whereBetween('metric_date', [$range['start'], $range['end']])
                ->orderByDesc('sessions')
                ->get();
        }

        public function referrers(Request $request)
        {
            $propertyIds = $this->allowedPropertyIds(
                $request->client_id,
                $request->group_id
            );

            // ✅ Only date filtering
            $range = $this->resolveDateRange($request);

            return Ga4Metric::whereIn('google_service_property_id', $propertyIds)
                ->where('report_type', 'referrer')
                ->whereBetween('metric_date', [$range['start'], $range['end']])
                ->orderByDesc('sessions')
                ->get();
        }





            public function monthlyAnalytics(Request $request)
            {
                $propertyIds = $this->allowedPropertyIds(
                    $request->client_id,
                    $request->group_id
                );

                $range = $this->resolveDateRange($request);

                return Ga4Metric::whereIn('google_service_property_id', $propertyIds)
                    ->where('report_type', 'monthly_overview')
                    ->whereBetween('metric_date', [$range['start'], $range['end']])
                    ->selectRaw('
                        DATE_FORMAT(metric_date, "%Y-%m-01") as metric_date,
                        SUM(sessions) as sessions,
                        SUM(users) as users,
                        SUM(JSON_EXTRACT(extra, "$.new_users")) as new_users
                    ')
                    ->groupBy(DB::raw('DATE_FORMAT(metric_date, "%Y-%m-01")'))
                    ->orderBy('metric_date')
                    ->get()
                    ->map(function ($row) {
                        return [
                            'metric_date' => $row->metric_date,
                            'sessions' => (int) $row->sessions,
                            'users' => (int) $row->users,
                            'extra' => [
                                'new_users' => (int) $row->new_users,
                            ],
                        ];
                    });

            }

        public function channelMonthlyAnalytics(Request $request)
        {
            $propertyIds = $this->allowedPropertyIds(
                $request->client_id,
                $request->group_id
            );

            $range = $this->resolveDateRange($request);

            $rows = \App\Models\Ga4Metric::whereIn('google_service_property_id', $propertyIds)
                ->where('report_type', 'channel_monthly')
                ->whereBetween('metric_date', [$range['start'], $range['end']])
                ->get();

            if ($rows->isEmpty()) {
                return response()->json([
                    'months' => [],
                    'channels' => [],
                ]);
            }

            /* -----------------------------------------
            1️⃣ Build ordered unique months
            ----------------------------------------- */
            $months = $rows
                ->pluck('metric_date')
                ->map(fn ($d) => \Carbon\Carbon::parse($d)->format('Y-m-01'))
                ->unique()
                ->sort()
                ->values();

            /* -----------------------------------------
            2️⃣ Define GA primary channels
            ----------------------------------------- */
            $primaryChannels = [
                'Direct',
                'Organic Search',
                'Referral',
                'Social',
            ];

            /* -----------------------------------------
            3️⃣ Normalize channel names
            ----------------------------------------- */
            $normalizeChannel = function (string $channel) {
                return match ($channel) {
                    'Organic Social', 'Paid Social' => 'Social',
                    default => $channel,
                };
            };

            /* -----------------------------------------
            4️⃣ Group rows by normalized channel + month
            ----------------------------------------- */
            $grouped = [];

            foreach ($rows as $row) {
                $month = \Carbon\Carbon::parse($row->metric_date)->format('Y-m-01');
                $channel = $normalizeChannel($row->dimension_value);

                if (!in_array($channel, $primaryChannels)) {
                    $channel = 'All Other Channels';
                }

                $grouped[$channel][$month][] = $row;
            }

            /* -----------------------------------------
            5️⃣ Build final response structure
            ----------------------------------------- */
            $result = [];

            foreach ($grouped as $channel => $monthBuckets) {
                $result[$channel] = [
                    'sessions' => [],
                    'views' => [],
                    'activeUsers' => [],
                    'screenPageViewsPerUser' => [],
                ];

                foreach ($months as $month) {
                    $bucket = $monthBuckets[$month] ?? [];

                    $sessions = collect($bucket)->sum('sessions');
                    $users    = collect($bucket)->sum('users');
                    $views    = collect($bucket)->sum('views');

                    $result[$channel]['sessions'][] = (int) $sessions;
                    $result[$channel]['views'][] = (int) $views;
                    $result[$channel]['activeUsers'][] = (int) $users;
                    $result[$channel]['screenPageViewsPerUser'][] =
                        $users > 0 ? round($views / $users, 2) : 0;
                }
            }

            /* -----------------------------------------
            6️⃣ Order channels like GA UI
            ----------------------------------------- */
            $ordered = [];
            foreach ($primaryChannels as $ch) {
                if (isset($result[$ch])) {
                    $ordered[$ch] = $result[$ch];
                }
            }

            if (isset($result['All Other Channels'])) {
                $ordered['All Other Channels'] = $result['All Other Channels'];
            }

            return response()->json([
                'months' => $months,
                'channels' => $ordered,
            ]);
        }



}
