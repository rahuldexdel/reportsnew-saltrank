<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SemrushCampaign extends Model
{
    protected $fillable = [
        'site_id',
        'project_id',
        'campaign_id',
        'url',
        'engine',
        'device',
        'language',
        'location_name',
        'keywords_count',
        'raw_data',
    ];

    protected $casts = [
        'raw_data' => 'array',
    ];

    public function trackingPositions()
    {
        return $this->hasMany(SemrushTrackingPosition::class);
    }
}
