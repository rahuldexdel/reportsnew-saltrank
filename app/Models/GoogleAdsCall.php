<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoogleAdsCall extends Model
{
    protected $fillable = [
        'ads_account_id',
        'campaign_id',
        'date',
        'total_calls',
    ];

    public function campaign()
    {
        return $this->belongsTo(GoogleAdsCampaign::class, 'campaign_id', 'campaign_id');
    }
}