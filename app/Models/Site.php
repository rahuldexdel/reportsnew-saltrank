<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Site extends Model
{
    protected $fillable = [
        'semrush_account_id',
        'project_id',
        'project_name',
        'domain',
        'client_id',
        'domain_unicode',
        'tools',
        'owner_id',
        'permission',
        'database',
    ];

        protected $casts = [
        'tools' => 'array',
        'permission' => 'array',
    ];
    public function semrushAccount()
    {
        return $this->belongsTo(SemrushAccount::class);
    }

    public function competitors()
    {
        return $this->hasMany(Competitor::class);
    }

    public function organicKeywords()
    {
        return $this->hasMany(OrganicKeyword::class);
    }
    public function client()
    {
        return $this->belongsTo(Client::class); // Assuming 'client_id' is the foreign key
    }
    public function organicKeywordsPrevious()
    {
        return $this->hasMany(OrganicKeyword::class);
    }

    public function semrushCampaigns()
    {
        return $this->hasMany(SemrushCampaign::class);
    }

}
