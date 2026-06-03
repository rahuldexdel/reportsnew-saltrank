<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoogleAdsCampaign extends Model
{
    protected $fillable = [
        'ads_account_id',
        'campaign_id',
        'name',
        'type',
        'status',
        'client_id',
        'is_assigned',
    ];

    // 🔗 Property (Account)
    public function property()
    {
        return $this->belongsTo(GoogleServiceProperty::class, 'ads_account_id');
    }

    // 🔗 Metrics
    public function metrics()
    {
        return $this->hasMany(GoogleAdsCampaignMetric::class, 'campaign_id', 'campaign_id');
    }

    public function deviceMetrics()
    {
        return $this->hasMany(GoogleAdsCampaignDeviceMetric::class, 'campaign_id', 'campaign_id');
    }

    public function keywords()
    {
        return $this->hasMany(GoogleAdsKeyword::class, 'campaign_id', 'campaign_id');
    }

    public function searchTerms()
    {
        return $this->hasMany(GoogleAdsSearchTerm::class, 'campaign_id', 'campaign_id');
    }

    public function ads()
    {
        return $this->hasMany(GoogleAdsAd::class, 'campaign_id', 'campaign_id');
    }

    public function demographics()
    {
        return $this->hasMany(GoogleAdsDemographic::class, 'campaign_id', 'campaign_id');
    }

    public function locations()
    {
        return $this->hasMany(GoogleAdsLocation::class, 'campaign_id', 'campaign_id');
    }

    // 🔗 Assignment
    public function assignments()
    {
        return $this->hasMany(ClientCampaignAssignment::class, 'campaign_id', 'campaign_id');
    }
}