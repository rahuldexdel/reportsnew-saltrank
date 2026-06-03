<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrganicKeyword extends Model
{
    protected $fillable = [
        'site_id',
        'competitor_id',
        'keyword',
        'position',
        'previous_position',
        'search_volume',
        'cpc',
        'url',
        'fetched_at',
    ];

    protected $casts = [
        'fetched_at' => 'date',
    ];

    public function site()
    {
        return $this->belongsTo(Site::class);
    }

    public function competitor()
    {
        return $this->belongsTo(Competitor::class);
    }
}
