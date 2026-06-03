<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoogleAdsKeyword extends Model
{
    protected $fillable = [
        'ads_account_id',
        'campaign_id',
        'keyword',
        'impressions',
        'clicks',
        'ctr',
        'cost',
        'date',
    ];

    public function campaign()
    {
        return $this->belongsTo(GoogleAdsCampaign::class, 'campaign_id', 'campaign_id');
    }
}