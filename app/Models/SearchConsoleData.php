<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SearchConsoleData extends Model
{
    protected $fillable = [
       'user_id', 'site_url', 'date', 'query', 'page_url', 'device',
        'clicks', 'impressions', 'ctr', 'position'
    ];
}
