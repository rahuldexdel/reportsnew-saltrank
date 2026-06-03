<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoogleAdsAd extends Model
{
    protected $fillable = [
        'ads_account_id',
        'campaign_id',
        'ad_id',
        'date',

        'type',
        'is_retargeting',

        'headline',
        'description',
        'image_url',
        'final_url',
        'ad_preview',

        'campaign_name',
        'ad_group_name',

        'impressions',
        'clicks',
        'ctr',
        'cost',
        'avg_cpc',
    ];

    public function campaign()
    {
        return $this->belongsTo(GoogleAdsCampaign::class, 'campaign_id', 'campaign_id');
    }
}