<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CallTrackingAccount extends Model
{
    protected $fillable = [
        'user_id',
        'account_id',
        'name',
        'api_key',
        'is_connected',
    ];

    protected $hidden = ['api_key'];


    public function clients()
    {
        return $this->belongsToMany(
            \App\Models\Client::class,
            'client_call_tracking_accounts'
        );
    }

}
