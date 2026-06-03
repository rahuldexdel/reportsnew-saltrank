<?php

namespace App\Models;

use App\Models\ClientGroup;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Client extends Model
{
    use HasFactory;

    protected $with = ['groups']; // If you want to always load groups
    
    protected $fillable = [
        'company_name',
        'logo',
        // 'data_dashboard',
        'status'
    ];
    
    public const STATUSES = [
        'Active' => 'Active',
        'Pending Assignment' => 'Pending Assignment',
        'Hold' => 'Hold',
        'Terminated' => 'Terminated',
    ];

    public function groups(): BelongsToMany
    {
        return $this->belongsToMany(ClientGroup::class)->withTimestamps();
    }

    public function getGroupNamesAttribute()
    {
        return $this->groups->pluck('name')->join(', ');
    }
    
    public function users()
    {
        return $this->hasMany(\App\Models\User::class);
    }


    public function callTrackingAccounts()
    {
        return $this->belongsToMany(
            \App\Models\CallTrackingAccount::class,
            'client_call_tracking_accounts'
        );
    }



}
