<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FacebookAdsInsight extends Model
{
    protected $table = 'facebook_ads_insights';

    protected $fillable = [
        'account_id',
        'ad_account_id',
        'campaign_id',
        'adset_id',
        'ad_id',
        'date',
        'impressions',
        'clicks',
        'spend',
        'ctr',
        'cpc',
        'reach',
        'age',
        'gender',
        'device_platform',
        'metadata'
    ];

    protected $casts = [
        'metadata' => 'array',
        'date' => 'date'
    ];
}