<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoogleAdsCampaignDeviceMetric extends Model
{
    protected $fillable = [
        'ads_account_id',
        'campaign_id',
        'device',
        'impressions',
        'clicks',
        'date',
    ];

    public function campaign()
    {
        return $this->belongsTo(GoogleAdsCampaign::class, 'campaign_id', 'campaign_id');
    }
}