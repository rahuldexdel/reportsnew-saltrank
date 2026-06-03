<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SimplifiCampaign extends Model
{

        protected $table = 'simplifi_campaigns_data';
        protected $fillable = [
            'organization_id',
            'account_id',
            'campaign_id',
            'campaign_name',
            'client_id',
            'is_assigned',
        ];

    public function stats()
    {
        return $this->hasMany(SimplifiCampaignStat::class, 'campaign_id', 'campaign_id');
    }

    public function organization()
    {
        return $this->belongsTo(SimplifiOrganizations::class, 'organization_id', 'organization_id');
    }


}
