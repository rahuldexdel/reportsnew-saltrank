<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class GoogleServiceReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_id',
        'report_date',
        'report_type',
        'dimension_1',
        'dimension_2',
        'dimension_3',
        'clicks',
        'impressions',
        'ctr',
        'position',
        'sessions',
        'users',
        'bounce_rate',
        'conversions',
        'raw_data'
    ];

    protected $casts = [
        'report_date' => 'date',
        'raw_data' => 'array'
    ];

    public function property()
    {
        return $this->belongsTo(GoogleServiceProperty::class);
    }
}
