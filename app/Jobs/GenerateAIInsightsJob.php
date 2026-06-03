<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;

use App\Models\AIInsight;

class GenerateAIInsightsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $startDate;
    protected $endDate;
    protected $clientId;
    protected $userId;

    public function __construct($data)
    {
        $this->startDate = $data['start_date'];
        $this->endDate = $data['end_date'];
        $this->clientId = $data['client_id'];
        $this->userId = $data['user_id'];
    }

    public function handle()
    {
        try {

            $start = \Carbon\Carbon::parse($this->startDate)->startOfDay();
            $end = \Carbon\Carbon::parse($this->endDate)->endOfDay();

            // ✅ Check existing (strict month check)
            $exists = AIInsight::where('client_id', $this->clientId)
                ->whereDate('start_date', $start->toDateString())
                ->whereDate('end_date', $end->toDateString())
                ->exists();

            if ($exists) {
                Log::info("AI Insights already exist for {$start} → {$end}");
                return;
            }

            // ✅ Build request for overview
            $request = new Request([
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
                'user_id' => $this->userId
            ]);

          

            $overviewController = app(\App\Http\Controllers\Reports\OverviewController::class);
            $overviewResponse = $overviewController->aioverviewData($request);
            $overviewData = $overviewResponse->getData(true);

          
            // ✅ AI prompt
            $prompt = app(\App\Http\Controllers\Reports\DashboardController::class)->getAIPrompt();
            $finalPrompt = $prompt . "\n\nDATA:\n" . json_encode($overviewData);

            $response = Http::withToken(env('OPENAI_API_KEY'))
                ->timeout(60)
                ->post('https://api.openai.com/v1/chat/completions', [
                    "model" => "gpt-4.1",
                    "messages" => [
                        ["role" => "user", "content" => $finalPrompt]
                    ],
                    "temperature" => 0.1
                ]);

            if (!$response->successful()) {
                Log::error('AI Job Failed', [
                    'response' => $response->body(),
                    'start' => $start,
                    'end' => $end
                ]);
                return;
            }

            $content = $response['choices'][0]['message']['content'] ?? null;
            $decoded = json_decode($content, true);

            if (!$decoded) {
                Log::error('AI JSON Decode Failed', ['content' => $content]);
                return;
            }

            // ✅ Save
            AIInsight::create([
                'client_id' => $this->clientId,
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
                'data' => $decoded,
                'last_synced_at' => now(),
            ]);

            Log::info("AI Insights saved for {$start} → {$end}");

        } catch (\Exception $e) {
            Log::error('AI Job Exception', [
                'message' => $e->getMessage()
            ]);
        }
    }
}