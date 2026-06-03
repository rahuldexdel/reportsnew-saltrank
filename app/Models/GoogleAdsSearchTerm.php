<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoogleAdsSearchTerm extends Model
{
    protected $fillable = [
        'ads_account_id',
        'campaign_id',
        'search_term',
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