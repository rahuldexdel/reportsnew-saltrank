<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoogleAdsDemographic extends Model
{
    protected $fillable = [
        'ads_account_id',
        'campaign_id',
        'type',
        'value',
        'impressions',
        'clicks',
        'date',
    ];

    public function campaign()
    {
        return $this->belongsTo(GoogleAdsCampaign::class, 'campaign_id', 'campaign_id');
    }
}