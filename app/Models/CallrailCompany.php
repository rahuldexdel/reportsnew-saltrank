<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CallrailCompany extends Model
{
    protected $table = 'callrail_companies';

    protected $fillable = [
        'call_rail_account_id',
        'user_id',
        'company_id',
        'name',
        'service_type',
        'property_id',
        'permission_level',
        'is_verified',
        'is_assigned',
        'client_id',
        'is_active',
        'last_synced_at',
        'metadata',
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'is_assigned' => 'boolean',
        'is_active' => 'boolean',
        'metadata' => 'array',
        'last_synced_at' => 'datetime',
    ];

    // 🔹 Relationships (optional)
    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}