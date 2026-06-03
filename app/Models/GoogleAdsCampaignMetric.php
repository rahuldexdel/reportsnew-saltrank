<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoogleAdsCampaignMetric extends Model
{
    protected $fillable = [
        'ads_account_id',
        'campaign_id',
        'impressions',
        'clicks',
        'ctr',
        'cost',
        'avg_cpc',
        'conversions',
        'date',
    ];

    public function campaign()
    {
        return $this->belongsTo(GoogleAdsCampaign::class, 'campaign_id', 'campaign_id');
    }
}