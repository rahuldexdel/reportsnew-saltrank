<?php

namespace App\Http\Controllers\Reports;

use App\Models\AiSummary;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class AiSummaryController extends Controller
{
        public function getSummary(Request $request)
        {
            $baseQuery = AiSummary::where('tab', $request->tab)
                ->where('range', $request->range);

            // CLIENT selected
            if ($request->filled('client_id')) {
                $baseQuery->where('client_id', $request->client_id);
            }

            // GROUP selected
            elseif ($request->filled('group_id')) {
                $clientIds = DB::table('client_client_group')
                    ->where('client_group_id', $request->group_id)
                    ->pluck('client_id');

                $baseQuery->whereIn('client_id', $clientIds);
            }

            // 🔥 latest per client
            $latestPerClient = $baseQuery
                ->select('client_id', DB::raw('MAX(created_at) as latest_created_at'))
                ->groupBy('client_id');

            return response()->json(
                AiSummary::joinSub($latestPerClient, 'latest', function ($join) {
                        $join->on('ai_summaries.client_id', '=', 'latest.client_id')
                            ->on('ai_summaries.created_at', '=', 'latest.latest_created_at');
                    })
                    ->get()
            );
        }
}
