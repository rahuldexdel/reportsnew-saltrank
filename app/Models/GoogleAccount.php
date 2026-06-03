<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class GoogleAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'google_id',
        'name',
        'email',
        'token',
        'refresh_token',
        'expires_at',
        'access_type',
        'scopes',
        'type',
        'is_connected',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'scopes' => 'json',
        'is_connected' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
