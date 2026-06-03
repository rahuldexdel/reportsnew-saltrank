<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AIInsight extends Model
{

    protected $table = 'ai_insights'; 
    protected $fillable = [
        'client_id',
        'start_date',
        'end_date',
        'data',
        'last_synced_at'
    ];

    protected $casts = [
        'data' => 'array',
        'last_synced_at' => 'datetime',
    ];
}
