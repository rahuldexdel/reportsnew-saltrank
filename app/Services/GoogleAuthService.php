<?php

namespace App\Services;

use App\Models\GoogleAccount;
use Carbon\Carbon;
use Google_Client;

class GoogleAuthService
{
    protected $googleTokenService;

    public function __construct(GoogleTokenService $googleTokenService)
    {
        $this->googleTokenService = $googleTokenService;
    }

    /**
     * Get a valid Google access token for a given user.
     */



     public function clientForAccount(GoogleAccount $account): Google_Client
    {
        $client = new Google_Client();

        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));

        $client->setAccessToken([
            'access_token' => $account->token,
            'refresh_token' => $account->refresh_token,
            'expires_in' => now()->diffInSeconds($account->expires_at),
        ]);

        // Refresh token if expired
        if ($client->isAccessTokenExpired()) {
            $newToken = $client->fetchAccessTokenWithRefreshToken(
                $account->refresh_token
            );

            if (!isset($newToken['access_token'])) {
                throw new \Exception('Unable to refresh Google access token');
            }

            $account->update([
                'token' => $newToken['access_token'],
                'expires_at' => now()->addSeconds($newToken['expires_in']),
                'refresh_token' => $newToken['refresh_token'] ?? $account->refresh_token,
            ]);

            $client->setAccessToken($newToken);
        }

        return $client;
    }


    public function getValidAccessToken($userId, $type = 'search-console')
    {
        $account = GoogleAccount::where('user_id', $userId)
            ->where('type', $type)
            ->where('is_connected', true)
            ->first();
        if (!$account || !$account->refresh_token) {
            throw new \Exception("Refresh token not found. Please re-authenticate Google account.");
        }
        if ($account->expires_at && Carbon::parse($account->expires_at)->isFuture()) {
            return $account->token;
        }
        return $this->googleTokenService->refreshAndSave($userId, $account->refresh_token);
    }
}
