<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Services\CallRailService;
use Illuminate\Http\Request;
use App\Http\Controllers\Reports\DashboardController;
use App\Models\Call;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\CallTrackingAccount;
use Illuminate\Support\Facades\DB;


class CallRailController extends Controller
{
    protected DashboardController $dashboard;

    public function __construct(DashboardController $dashboard)
    {
        $this->dashboard = $dashboard;
    }
                private function get_user(){
                    $user = User::select('id', 'client_id', 'user_role', 'client_Groups_id')
                    ->find(Auth::id());
                    return $user;
                }
            private function getAllowedCompanies(Request $request)
            {
                $user = auth()->user();
                if (!$user) {
                    abort(401, 'Unauthenticated');
                }
                $query = \App\Models\CallrailCompany::query()
                    ->where('is_assigned', 1)
                    ->whereNotNull('client_id');
                if ($user->user_role === 'Super Admin') {
                    if ($request->filled('client_id')) {
                        $query->where('client_id', $request->client_id);
                    }
                    if ($request->filled('group_id')) {
                        $clientIds = DB::table('client_client_group')
                            ->where('client_group_id', $request->group_id)
                            ->pluck('client_id');

                        $query->whereIn('client_id', $clientIds);
                    }
                    return $query->get();
                }
                if ($user->user_role === 'Client') {
                    return $query->where('client_id', $user->client_id)->get();
                }
                return collect();
            }

              public function currentTimeseries(Request $request)
              {
                    $companies = $this->getAllowedCompanies($request);
                    if ($companies->isEmpty()) {
                        return response()->json([
                            'status' => 'not_assigned',
                            'data' => []
                        ]);
                    }
                    $dates = $this->dashboard->getDateRange($request->query('range', 7));
                    $final = [];
                    $totalResults = [
                        'total_calls' => 0,
                        'missed_calls' => 0,
                        'answered_calls' => 0,
                        'first_time_callers' => 0,
                        'average_duration' => 0,
                        'leads' => 0,
                    ];
                    $totalDuration = 0;
                    $totalCallsForAvg = 0;
                    foreach ($companies as $company) {
                        $callRail = new CallRailService(
                            '0fb3639a0638011d12b93f98338d0266',
                            $company->call_rail_account_id
                        );
                        $response = $callRail->getCallsTimeSeries([
                            'start_date' => $dates['currentStart'],
                            'end_date'   => $dates['currentEnd'],
                            'fields'     => $this->timeSeriesFields(),
                        ], $company->company_id);
                        if (!empty($response['total_results'])) {
                            $calls = $response['total_results']['total_calls'] ?? 0;
                            $avg   = $response['total_results']['average_duration'] ?? 0;
                            $totalResults['total_calls'] += $calls;
                            $totalResults['missed_calls'] += $response['total_results']['missed_calls'] ?? 0;
                            $totalResults['answered_calls'] += $response['total_results']['answered_calls'] ?? 0;
                            $totalResults['first_time_callers'] += $response['total_results']['first_time_callers'] ?? 0;
                            $totalResults['leads'] += $response['total_results']['leads'] ?? 0;
                            $totalDuration += ($avg * $calls);
                            $totalCallsForAvg += $calls;
                        }
                        if (!empty($response['data'])) {
                            foreach ($response['data'] as $row) {
                                $date  = $row['date'];
                                $calls = $row['total_calls'] ?? 0;
                                $avg   = $row['average_duration'] ?? 0;
                                if (!isset($final[$date])) {
                                    $final[$date] = [
                                        'date' => $date,
                                        'total_calls' => $calls,
                                        'answered_calls' => $row['answered_calls'] ?? 0,
                                        'missed_calls' => $row['missed_calls'] ?? 0,
                                        'first_time_callers' => $row['first_time_callers'] ?? 0,
                                        'leads' => $row['leads'] ?? 0,
                                        '_duration_total' => $avg * $calls,
                                        '_calls_total' => $calls,
                                    ];
                                } else {
                                    $final[$date]['total_calls'] += $calls;
                                    $final[$date]['answered_calls'] += $row['answered_calls'] ?? 0;
                                    $final[$date]['missed_calls'] += $row['missed_calls'] ?? 0;
                                    $final[$date]['first_time_callers'] += $row['first_time_callers'] ?? 0;
                                    $final[$date]['leads'] += $row['leads'] ?? 0;

                                    $final[$date]['_duration_total'] += ($avg * $calls);
                                    $final[$date]['_calls_total'] += $calls;
                                }
                            }
                        }
                    }
                    if ($totalCallsForAvg > 0) {
                        $avg = round($totalDuration / $totalCallsForAvg);
                        $totalResults['average_duration'] = $avg;
                        $totalResults['formatted_average_duration'] = gmdate("i\\m s\\s", $avg);
                    }
                    foreach ($final as &$row) {
                        if ($row['_calls_total'] > 0) {
                            $avg = round($row['_duration_total'] / $row['_calls_total']);
                            $row['average_duration'] = $avg;
                            $row['formatted_average_duration'] = gmdate("i\\m s\\s", $avg);
                        } else {
                            $row['average_duration'] = 0;
                            $row['formatted_average_duration'] = "0s";
                        }
                        unset($row['_duration_total'], $row['_calls_total']);
                    }
                    ksort($final);
                    return response()->json([
                        'total_results' => $totalResults,
                        'data' => array_values($final)
                    ]);
                }

              public function previousTimeseries(Request $request)
              {
                    $companies = $this->getAllowedCompanies($request);
                    if ($companies->isEmpty()) {
                        return response()->json([
                            'status' => 'not_assigned',
                            'data' => []
                        ]);
                    }
                    $dates = $this->dashboard->getDateRange($request->query('range', 7));
                    $final = [];
                    $totalResults = [
                        'total_calls' => 0,
                        'missed_calls' => 0,
                        'answered_calls' => 0,
                        'first_time_callers' => 0,
                        'average_duration' => 0,
                        'leads' => 0,
                    ];
                    $totalDuration = 0;
                    $totalCallsForAvg = 0;
                    foreach ($companies as $company) {
                        $callRail = new CallRailService(
                            '0fb3639a0638011d12b93f98338d0266',
                            $company->call_rail_account_id
                        );
                        $response = $callRail->getCallsTimeSeries([
                            'start_date' => $dates['previousStart'],
                            'end_date'   => $dates['previousEnd'],
                            'fields'     => $this->timeSeriesFields(),
                        ], $company->company_id);
                        if (!empty($response['total_results'])) {
                            $calls = $response['total_results']['total_calls'] ?? 0;
                            $avg   = $response['total_results']['average_duration'] ?? 0;
                            $totalResults['total_calls'] += $calls;
                            $totalResults['missed_calls'] += $response['total_results']['missed_calls'] ?? 0;
                            $totalResults['answered_calls'] += $response['total_results']['answered_calls'] ?? 0;
                            $totalResults['first_time_callers'] += $response['total_results']['first_time_callers'] ?? 0;
                            $totalResults['leads'] += $response['total_results']['leads'] ?? 0;
                            $totalDuration += ($avg * $calls);
                            $totalCallsForAvg += $calls;
                        }
                        if (!empty($response['data'])) {
                            foreach ($response['data'] as $row) {
                                $date  = $row['date'];
                                $calls = $row['total_calls'] ?? 0;
                                $avg   = $row['average_duration'] ?? 0;
                                if (!isset($final[$date])) {
                                    $final[$date] = [
                                        'date' => $date,
                                        'total_calls' => $calls,
                                        'answered_calls' => $row['answered_calls'] ?? 0,
                                        'missed_calls' => $row['missed_calls'] ?? 0,
                                        'first_time_callers' => $row['first_time_callers'] ?? 0,
                                        'leads' => $row['leads'] ?? 0,
                                        '_duration_total' => $avg * $calls,
                                        '_calls_total' => $calls,
                                    ];
                                } else {
                                    $final[$date]['total_calls'] += $calls;
                                    $final[$date]['answered_calls'] += $row['answered_calls'] ?? 0;
                                    $final[$date]['missed_calls'] += $row['missed_calls'] ?? 0;
                                    $final[$date]['first_time_callers'] += $row['first_time_callers'] ?? 0;
                                    $final[$date]['leads'] += $row['leads'] ?? 0;

                                    $final[$date]['_duration_total'] += ($avg * $calls);
                                    $final[$date]['_calls_total'] += $calls;
                                }
                            }
                        }
                    }
                    if ($totalCallsForAvg > 0) {
                        $avg = round($totalDuration / $totalCallsForAvg);
                        $totalResults['average_duration'] = $avg;
                        $totalResults['formatted_average_duration'] = gmdate("i\\m s\\s", $avg);
                    }
                    foreach ($final as &$row) {
                        if ($row['_calls_total'] > 0) {
                            $avg = round($row['_duration_total'] / $row['_calls_total']);
                            $row['average_duration'] = $avg;
                            $row['formatted_average_duration'] = gmdate("i\\m s\\s", $avg);
                        } else {
                            $row['average_duration'] = 0;
                            $row['formatted_average_duration'] = "0s";
                        }
                        unset($row['_duration_total'], $row['_calls_total']);
                    }
                    ksort($final);
                    return response()->json([
                        'total_results' => $totalResults,
                        'data' => array_values($final)
                    ]);
                }


            public function calls(Request $request)
            {
                $companies = $this->getAllowedCompanies($request);
                if ($companies->isEmpty()) {
                    return response()->json([
                        'status' => 'not_assigned',
                        'data' => []
                    ]);
                }
                $dates = $this->dashboard->getDateRange($request->query('range', 7));

              $fields = [
                    'start_time',
                    'duration',
                    'customer_name',
                    'first_call',
                    'total_calls',
                    'company_name',
                    'customer_phone_number',
                    'source_name',
                    'campaign',
                    'tags',
                    'keywords',
                    'milestones'
                ];

                $allCalls = [];
                foreach ($companies as $company) {
                    $callRail = new CallRailService(
                        '0fb3639a0638011d12b93f98338d0266',
                        $company->call_rail_account_id
                    );
                    $response = $callRail->getCalls([
                        'start_date' => $dates['currentStart'],
                        'end_date'   => $dates['currentEnd'],
                        'fields'     => implode(',', $fields),
                        'per_page'   => 100,
                    ], $company->company_id);
                    if (!empty($response['calls'])) {
                        $allCalls = array_merge($allCalls, $response['calls']);
                    }
                }
                return response()->json([
                    'calls' => $allCalls,
                    'total' => count($allCalls),
                ]);
            }


        public function sources(Request $request)
        {
            $companies = $this->getAllowedCompanies($request);
            if ($companies->isEmpty()) {
                return response()->json([]);
            }
            $dates = $this->dashboard->getDateRange($request->query('range', 7));
            $final = [];
            foreach ($companies as $company) {
                $callRail = new CallRailService(
                    '0fb3639a0638011d12b93f98338d0266',
                    $company->call_rail_account_id
                );
                $response = $callRail->getCallsSource([
                    'start_date' => $dates['currentStart'],
                    'end_date'   => $dates['currentEnd'],
                    'fields'     => $this->timeSeriesFields(),
                ], $company->company_id);
                $final[] = [
                    'company_id'   => $company->company_id,
                    'company_name' => $company->name,
                    'totals' => $response['total_results'] ?? [],
                    'sources' => $response['grouped_results'] ?? []
                ];
            }
            return response()->json($final);
        }

       public function campaign(Request $request)
        {
            $companies = $this->getAllowedCompanies($request);
            if ($companies->isEmpty()) {
                return response()->json([]);
            }
            $dates = $this->dashboard->getDateRange($request->query('range', 7));
            $final = [];
            foreach ($companies as $company) {
                $callRail = new CallRailService(
                    '0fb3639a0638011d12b93f98338d0266',
                    $company->call_rail_account_id
                );
                $response = $callRail->getCallsCampaign([
                    'start_date' => $dates['currentStart'],
                    'end_date'   => $dates['currentEnd'],
                    'fields'     => $this->timeSeriesFields(),
                ], $company->company_id);
                $final[] = [
                    'company_id'   => $company->company_id,
                    'company_name' => $company->name,
                    'totals' => $response['total_results'] ?? [],
                    'Campaign' => $response['grouped_results'] ?? []
                ];
            }
            return response()->json($final);
        }

            private function timeSeriesFields()
            {
                return implode(',', [
                    'missed_calls',
                    'answered_calls',
                    'first_time_callers',
                    'average_duration',
                    'formatted_average_duration',
                    'leads',
                    'total_calls',
                ]);
            }
}
