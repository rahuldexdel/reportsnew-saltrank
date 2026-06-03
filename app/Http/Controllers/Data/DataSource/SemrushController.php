<?php
namespace App\Http\Controllers\Data\DataSource;

use App\Http\Controllers\Controller;
use App\Models\SemrushAccount;
use App\Models\SemrushClientAssignment;
use App\Models\Site;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use App\Models\Client;
use App\Services\SemrushService;
use Illuminate\Support\Facades\DB;

use App\Models\ClientGroup;

class SemrushController extends Controller
{
   
      public function domainOverview(Request $request)
        {
            $user = auth()->user();
            abort_if(!$user, 401);

            $clientId = $request->query('client_id');
            $groupId  = $request->query('group_id');
            $range = $request->query('range', '7');

            $dashboard = new \App\Http\Controllers\Reports\DashboardController();
            $dates = $dashboard->getDateRange($range);

              $currentStart = \Carbon\Carbon::parse($dates['currentStart'])->toDateString();
            $currentEnd = \Carbon\Carbon::parse($dates['currentEnd'])->toDateString();

            $previousStart = \Carbon\Carbon::parse($dates['previousStart'])->toDateString();
            $previousEnd = \Carbon\Carbon::parse($dates['previousEnd'])->toDateString();

            if ($user->user_role === 'Super Admin') {
                $allowedClientIds = collect();

                if ($clientId) {
                    $allowedClientIds->push($clientId);
                }

                if ($groupId) {
                    $clientIds = DB::table('client_client_group')
                        ->where('client_group_id', $groupId)
                        ->pluck('client_id');

                    $allowedClientIds = $allowedClientIds->merge($clientIds);
                }

                $allowedClientIds = $allowedClientIds->unique();
            } else {
                $allowedClientIds = collect();

                if ($user->client_id) {
                    $allowedClientIds->push($user->client_id);
                }

                if ($user->client_groups_id) {
                    $groupClientIds = DB::table('client_client_group')
                        ->where('client_group_id', $user->client_groups_id)
                        ->pluck('client_id');

                    $allowedClientIds = $allowedClientIds->merge($groupClientIds);
                }

                $allowedClientIds = $allowedClientIds->unique();
            }

           $sites = Site::with([
                'organicKeywords' => function ($q) use ($currentStart, $currentEnd) {
                    $q->whereNull('competitor_id')
                        ->whereDate('fetched_at', '>=', $currentStart)
                        ->whereDate('fetched_at', '<=', $currentEnd);
                },

                'competitors.organicKeywords' => function ($q) use ($currentStart, $currentEnd) {
                    $q->whereDate('fetched_at', '>=', $currentStart)
                        ->whereDate('fetched_at', '<=', $currentEnd);
                },

                'organicKeywordsPrevious' => function ($q) use ($previousStart, $previousEnd) {
                    $q->whereNull('competitor_id')
                        ->whereDate('fetched_at', '>=', $previousStart)
                        ->whereDate('fetched_at', '<=', $previousEnd);
                },

                'competitors.organicKeywordsPrevious' => function ($q) use ($previousStart, $previousEnd) {
                    $q->whereDate('fetched_at', '>=', $previousStart)
                        ->whereDate('fetched_at', '<=', $previousEnd);
                },
            ])
            ->when($clientId, function ($query) use ($clientId) {
                return $query->where('client_id', $clientId);
            })
            ->when($groupId, function ($query) use ($groupId) {
                $clientIds = DB::table('client_client_group')
                    ->where('client_group_id', $groupId)
                    ->pluck('client_id');

                return $query->whereIn('client_id', $clientIds);
            })
            ->when(
                $allowedClientIds->isNotEmpty(),
                fn ($query) => $query->whereIn('client_id', $allowedClientIds)
            )
            ->get();

            $results = $sites->map(fn ($site) => [
                'domain'   => $site->domain,
                'database' => $site->database,

                'organic_keywords' => $site->organicKeywords
                    ->sortBy('position')
                    ->values(),

                'previous_organic_keywords' => $site->organicKeywordsPrevious
                    ->sortBy('position')
                    ->values(),

                'competitors' => $site->competitors->map(fn ($c) => [
                    'domain' => $c->domain,

                    'keywords' => $c->organicKeywords
                        ->sortBy('position')
                        ->values(),

                    'previous_keywords' => $c->organicKeywordsPrevious
                        ->sortBy('position')
                        ->values(),
                ]),
            ]);

            return response()->json([
                'data' => $results,
                'range' => [
                    'currentStart' => $currentStart,
                    'currentEnd' => $currentEnd,
                    'previousStart' => $previousStart,
                    'previousEnd' => $previousEnd,
                ],
            ]);
        }



        public function index()
        {
            $account = SemrushAccount::where('user_id', auth()->id())
                    ->with([
                        'sites', 
                    ])
                ->first();
            /// dd( $account);

            return Inertia::render('Data/Datasource/semrushService', [
                'account' => $account,
                'clients' => Client::select('id', 'company_name')->get(),
                'clientGroups' => ClientGroup::latest()->get(),
                'statuses' => Client::STATUSES,
            ]);
        }



        public function assign(Request $request)
            {
                $data = $request->validate([
                    'site_id'   => 'required|exists:sites,id',
                    'client_id' => 'required|exists:clients,id',
                ]);

                $site = Site::findOrFail($data['site_id']);

                $site->update([
                    'client_id' => $data['client_id'],
                ]);

                return back()->with('success', '');
            }

            public function unassign(Request $request)
            {
                $data = $request->validate([
                    'site_id' => 'required|exists:sites,id',
                ]);

                $site = Site::findOrFail($data['site_id']);

                $site->update([
                    'client_id' => null,
                ]);

                return back()->with('success', '');
            }


}
