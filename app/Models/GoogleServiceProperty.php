<?php

namespace App\Models;

use App\Models\GoogleAccount;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class GoogleServiceProperty extends Model
{
    use HasFactory;

    protected $fillable = [
        'google_account_id',
        'user_id',
        'service_type',
        'property_id',
        'property_name',
        'permission_level',
        'is_verified',
        'is_assigned',
        'client_id',
        'is_active',
        'last_synced_at',
        'metadata'
    ];

    protected $casts = [
        'metadata' => 'array',
        'is_verified' => 'boolean',
        'is_assigned' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function account()
    {
        return $this->belongsTo(GoogleAccount::class, 'google_account_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class, 'client_id');
    }


    // Helper methods for different service types
    public function isSearchConsole()
    {
        return $this->service_type === 'search-console';
    }

    public function isAnalytics()
    {
        return $this->service_type === 'analytics';
    }

    public function isAds()
    {
        return $this->service_type === 'ads';
    }

    public function campaigns()
    {
        return $this->hasMany(
            GoogleAdsCampaign::class,
            'ads_account_id',   // campaigns table
            'id'                // property id
        );
    }
}
