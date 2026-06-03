<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Call extends Model
{
    protected $fillable = [
        'call_rail_id',
        'call_date',
    ];

    protected $casts = [
        'call_date' => 'date',
    ];
}