<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\TabSummary;


class TabSummaryController extends Controller
{
            public function index(Request $request)
            {
                $query = TabSummary::where('tab_key', $request->tab_key);

                if ($request->data_source_id) {
                    $query->where('data_source_id', $request->data_source_id);
                }

                if ($request->client_group_id) {
                    $query->where('client_group_id', $request->client_group_id);
                }

                if ($request->client_id) {
                    $query->where('client_id', $request->client_id);
                }

                return response()->json(
                    $query->orderBy('created_at', 'desc')->get()
                );
            }

public function store(Request $request)
{
    if ($request->id) {

        $summary = TabSummary::findOrFail($request->id);

        $summary->update([
            'data_source_id' => $request->data_source_id,
            'tab_key' => $request->tab_key,
            'client_group_id' => $request->client_group_id,
            'client_id' => $request->client_id,
            'client_name' => $request->client_name,
            'client_group_name' => $request->client_group_name,
            'title' => $request->title,
            'summary' => $request->summary,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
        ]);

    } else {

        $summary = TabSummary::create([
            'data_source_id' => $request->data_source_id,
            'tab_key' => $request->tab_key,
            'client_group_id' => $request->client_group_id,
            'client_id' => $request->client_id,
            'client_name' => $request->client_name,
            'client_group_name' => $request->client_group_name,
            'title' => $request->title,
            'summary' => $request->summary,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
        ]);
    }

    return response()->json([
        'success' => true,
        'summary' => $summary
    ]);
}
        public function destroy($id)
        {
            TabSummary::findOrFail($id)->delete();
            return response()->json(['success' => true]);
        }

}