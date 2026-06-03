<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CallRailService
{
    protected $apiKey;
    protected $accountId;
    protected $baseUrl;

    public function __construct(?string $apiKey = null, ?string $accountId = null)
    {
        $this->apiKey    = $apiKey ?? config('services.callrail.api_key');
        $this->accountId = $accountId ?? config('services.callrail.account_id');
        $this->baseUrl   = config('services.callrail.base_url', 'https://api.callrail.com/v3');
    }

    public function verifyAccount(): array
    {
        return $this->request('get', "/a/{$this->accountId}.json");
    }

    public function request($method, $endpoint, $params = [])
    {
        if (!$this->apiKey || !$this->accountId) {
            return ['error' => 'CallRail credentials not configured'];
        }
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Token token="' . $this->apiKey . '"',
                'Accept' => 'application/json',
            ])->timeout(30)->$method($this->baseUrl . $endpoint, $params);

            if ($response->failed()) {
                Log::error('CallRail API Error', [
                    'endpoint' => $endpoint,
                    'params' => $params,
                    'response' => $response->body(),
                ]);
                return [
                    'error' => 'CallRail API request failed',
                    'details' => $response->json()
                ];
            }
            return $response->json();

        } catch (\Exception $e) {
            Log::error('CallRail Exception', [
                'message' => $e->getMessage(),
                'endpoint' => $endpoint,
            ]);
            return [
                'error' => 'CallRail exception',
                'message' => $e->getMessage()
            ];
        }
    }

    private function applyCompanyFilter(array $filters = [], ?string $companyId = null)
    {
        if ($companyId) {
            $filters['company_id'] = $companyId;
        }
        return $filters;
    }

    public function getCalls(array $filters = [], ?string $companyId = null)
    {
        return $this->request(
            'get',
            "/a/{$this->accountId}/calls.json",
            $this->applyCompanyFilter($filters, $companyId)
        );
    }

    public function getCallsTimeSeries(array $filters = [], ?string $companyId = null)
    {
        return $this->request(
            'get',
            "/a/{$this->accountId}/calls/timeseries.json",
            $this->applyCompanyFilter($filters, $companyId)
        );
    }


    public function getCallsSource(array $filters = [], ?string $companyId = null)
    {
        $filters['group_by'] = $filters['group_by'] ?? 'source';

        return $this->request(
            'get',
            "/a/{$this->accountId}/calls/summary.json",
            $this->applyCompanyFilter($filters, $companyId)
        );
    }

    public function getCallsCampaign(array $filters = [], ?string $companyId = null)
    {
        $filters['group_by'] = $filters['group_by'] ?? 'campaign';

        return $this->request(
            'get',
            "/a/{$this->accountId}/calls/summary.json",
            $this->applyCompanyFilter($filters, $companyId)
        );
    }

    public function getCallDetails(string $callId, array $fields = [], ?string $companyId = null)
    {
        $query = [];
        if (!empty($fields)) {
            $query['fields'] = implode(',', $fields);
        }
        $query = $this->applyCompanyFilter($query, $companyId);
        return $this->request(
            'get',
            "/a/{$this->accountId}/calls/{$callId}.json",
            $query
        );
    }
}