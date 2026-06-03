<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\CallRailService;
use App\Models\Call;
use Carbon\Carbon;

class FetchCallRailCalls extends Command
{
    protected $signature = 'callrail:fetch {months=1}';
    protected $description = 'Fetch CallRail call IDs for the last X months';

    public function handle(CallRailService $callRail): int
    {
        $months = (int) $this->argument('months');

        $startDate = Carbon::now()->subMonths($months)->format('Y-m-d');
        $endDate   = Carbon::now()->format('Y-m-d');

        $this->info("Fetching call IDs from $startDate to $endDate...");

        $page = 1;
        $perPage = 100;
        $totalNew = 0;

        do {
            $response = $callRail->getCalls([
                'start_date' => $startDate,
                'end_date'   => $endDate,
                'per_page'   => $perPage,
                'page'       => $page,
            ]);

            if (empty($response['calls'])) {
                $this->info("No calls found on page $page. Stopping.");
                break;
            }

            $newThisPage = 0;

            foreach ($response['calls'] as $call) {
                $callDate = null;

                if (!empty($call['start_time'])) {
                    $callDate = explode('T', $call['start_time'])[0];
                }

                $record = Call::firstOrCreate(
                    [
                        'call_rail_id' => $call['id'],
                    ],
                    [
                        'call_date' => $callDate,
                    ]
                );

                if ($record->wasRecentlyCreated) {
                    $newThisPage++;
                    $totalNew++;
                }
            }

            $this->info("Page $page: Fetched " .
                count($response['calls']) .
                " calls, New saved: $newThisPage");

            $page++;
            $totalPages = $response['total_pages'] ?? $page;

        } while ($page <= $totalPages);

        $this->info("✅ Finished! Total new call IDs saved: $totalNew");

        return 0;
    }
}
