<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Dashboard extends Model
{
    protected $fillable = [
        'name',
        'client_id',
        'client_group_id',
        'data_profile',
        'created_by'
    ];
}
