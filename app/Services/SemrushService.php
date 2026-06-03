<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SemrushService
{
    protected string $baseUrl = 'https://api.semrush.com/';

    public function fetchReport(
        string $apiKey,
        string $domain,
        string $database,
        string $type,
        string $exportColumns,
        int $limit,
        array $extraParams = []
    ): array {
        $params = array_merge([
            'type' => $type,
            'key' => $apiKey,
            'domain' => $domain,
            'database' => $database,
            'export_columns' => $exportColumns,
            'display_limit' => $limit,
        ], $extraParams);

        $response = Http::timeout(60)->get($this->baseUrl, $params);

        $body = trim($response->body());

        if (!$response->successful()) {
            Log::error('SEMRUSH HTTP ERROR', [
                'status' => $response->status(),
                'type' => $type,
                'domain' => $domain,
                'body' => $body,
            ]);

            return [];
        }

        if (str_starts_with($body, 'ERROR')) {
            Log::error('SEMRUSH ERROR', [
                'type' => $type,
                'domain' => $domain,
                'body' => $body,
            ]);

            return [];
        }

        return $this->csvToArray($body);
    }

    private function csvToArray(string $csv): array
    {
        $lines = array_filter(explode("\n", trim($csv)));

        if (empty($lines)) {
            return [];
        }

        $headers = str_getcsv(array_shift($lines), ';');
        $result = [];

        foreach ($lines as $line) {
            $row = str_getcsv($line, ';');

            if (count($row) === count($headers)) {
                $result[] = array_combine($headers, $row);
            }
        }

        return $result;
    }
}