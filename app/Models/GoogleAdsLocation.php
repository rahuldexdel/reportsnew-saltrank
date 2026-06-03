<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoogleAdsLocation extends Model
{
    protected $fillable = [
        'ads_account_id',
        'campaign_id',
        'region',
        'city',
        'target_type',
        'impressions',
        'clicks',
        'conversions',
        'date',
    ];

    public function campaign()
    {
        return $this->belongsTo(GoogleAdsCampaign::class, 'campaign_id', 'campaign_id');
    }
}