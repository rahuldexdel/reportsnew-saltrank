<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SemrushTrackingPosition extends Model
{
   protected $fillable = [
        'site_id',
        'semrush_campaign_id',
        'prompt_id',
        'keyword',
        'tracking_date',
        'position',
        'visibility',
        'sov',
        'traffic',
        'traffic_cost',
        'serp_features',
        'raw_data',
    ];

    protected $casts = [
        'serp_features' => 'array',
        'raw_data' => 'array',
    ];
}
