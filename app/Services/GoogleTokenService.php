<?php

namespace App\Services;

use App\Models\GoogleAccount;
use Illuminate\Support\Facades\Http;

class GoogleTokenService
{
 

    /**
     * Refreshes the access token using the refresh token and updates the DB
     */
    public function refreshAndSave($userId, $refreshToken)
    {
        $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'refresh_token' => $refreshToken,
            'grant_type' => 'refresh_token',
        ]);


        if ($response->successful()) {
            $accessToken = $response->json('access_token');
            $expiresIn = $response->json('expires_in'); // usually 3600 (1 hour)

            GoogleAccount::where('user_id', $userId)
                ->where('type', 'search-console')
                ->update([
                    'token' => $accessToken,
                    'expires_at' => now()->addSeconds($expiresIn),
                    'is_connected' => true
                ]);

            return $accessToken;
        } else {
            throw new \Exception('Failed to refresh token: ' . $response->body());
        }
    }
}
