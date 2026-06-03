<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoogleSearchConsole extends Model
{
    protected $fillable = [
        'user_id',
        'site_url',
        'access_token',
    ];
}
