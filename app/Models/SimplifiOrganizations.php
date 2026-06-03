<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SimplifiOrganizations extends Model
{
    use HasFactory;

    protected $fillable = [
        'account_id',
        'organization_id',
        'name',
        'custom_id',
        'ancestry',
        'public_key',
        'website',
        'client_id',
        'is_assigned',
    ];

    /**
     * Relationship between account and organization
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<SimplifiAccount, SimplifiOrganizations>
     */
    public function account()
    {
        return $this->belongsTo(SimplifiAccount::class, 'account_id');
    }

    public function client()
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    /**
     * Relationship between campaigns and organization
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<SimplifiCampaigns, SimplifiOrganizations>
     */
    // public function campaigns()
    // {
    //     return $this->hasMany(SimplifiCampaigns::class, 'organization_id');
    // }


    public function campaigns()
    {
                return $this->hasMany(SimplifiCampaign::class, 'organization_id', 'organization_id');

    }

}
