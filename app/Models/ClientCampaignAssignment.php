<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientCampaignAssignment extends Model
{
    protected $fillable = [
        'client_id',
        'campaign_id',
        'ads_account_id',
    ];

    public function campaign()
    {
        return $this->belongsTo(GoogleAdsCampaign::class, 'campaign_id', 'campaign_id');
    }
}