<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Google\Ads\GoogleAds\Lib\V22\GoogleAdsClientBuilder;
use Google\Ads\GoogleAds\Lib\OAuth2TokenBuilder;
use Google\Ads\GoogleAds\V22\Services\SearchGoogleAdsRequest;

class GoogleAdsService
{
    protected function buildClient($googleAccount, $loginCustomerId)
    {
        $oAuth2Credential = (new OAuth2TokenBuilder())
            ->withClientId(config('services.google.client_id'))
            ->withClientSecret(config('services.google.client_secret'))
            ->withRefreshToken($googleAccount->refresh_token)
            ->build();

        $builder = (new GoogleAdsClientBuilder())
            ->withDeveloperToken(config('services.google.ads_developer_token'))
            ->withOAuth2Credential($oAuth2Credential);

        if (!empty($loginCustomerId)) {
            $builder->withLoginCustomerId((string) $loginCustomerId);
        }

        $googleAdsClient = $builder->build();

        return $googleAdsClient->getGoogleAdsServiceClient();
    }

    public function query($googleAccount, $customerId, $gaql, $loginCustomerId = null)
    {
        // Log::info('GoogleAds query', [
        //     'customer_id' => $customerId,
        //     'login_customer_id' => $loginCustomerId,
        // ]);

        $client = $this->buildClient($googleAccount, $loginCustomerId);

        $request = new SearchGoogleAdsRequest([
            'customer_id' => (string) $customerId,
            'query' => $gaql,
        ]);

        return $client->search($request);
    }
}