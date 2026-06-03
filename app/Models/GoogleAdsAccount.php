<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoogleAdsAccount extends Model
{
    protected $fillable = [
        'google_account_id',
        'customer_id',
        'login_customer_id',
        'name',
        'currency',
        'timezone'
    ];

    public function googleAccount()
    {
        return $this->belongsTo(GoogleAccount::class);
    }

    public function dailyMetrics()
    {
        return $this->hasMany(GoogleAdsDailyMetric::class, 'ads_account_id');
    }

    public function campaigns()
    {
        return $this->hasMany(GoogleAdsCampaign::class, 'ads_account_id');
    }

    public function keywords()
    {
        return $this->hasMany(GoogleAdsKeyword::class, 'ads_account_id');
    }
}
