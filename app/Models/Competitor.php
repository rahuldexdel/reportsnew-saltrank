<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Competitor extends Model
{
    protected $fillable = [
        'site_id',
        'domain',
        'relevance',
        'common_keywords',
        'organic_keywords',
        'organic_traffic',
        'organic_cost',
    ];

    public function site()
    {
        return $this->belongsTo(Site::class);
    }

    public function organicKeywords()
    {
        return $this->hasMany(OrganicKeyword::class);
    }
    public function organicKeywordsPrevious()
    {
        return $this->hasMany(OrganicKeyword::class);
    }
}
