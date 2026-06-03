<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SimplifiCampaignStat extends Model
{
    
     protected $table = 'simplifi_campaign_stats';
    protected $fillable = [
        'org_id',
        'account_id',
        'geofence',
        'campaign_id',
        'stat_date',
        'impressions',
        'clicks',
        'ctr',
        'cpm',
        'cpc',
        'cpa',
        'vcr',
        'weighted_actions',
        'total_spend',
    ];

    protected $casts = [
        'stat_date' => 'date',
    ];

    public function campaign()
    {
        return $this->belongsTo(SimplifiCampaign::class, 'campaign_id', 'campaign_id');
    }
}
