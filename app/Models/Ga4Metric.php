<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ga4Metric extends Model
{
    protected $fillable = [
        'google_service_property_id',
        'report_type',
        'metric_date',
        'dimension_name',
        'dimension_value',
        'sessions',
        'engaged_sessions',
        'views',
        'users',
        'event_count',
        'engagement_rate',
        'avg_engagement_time',
        'extra',
    ];

    protected $casts = [
        'metric_date' => 'date',
        'engagement_rate' => 'float',
        'avg_engagement_time' => 'float',
        'extra' => 'array',
    ];
}

