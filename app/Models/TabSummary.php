<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TabSummary extends Model
{
    protected $fillable = [
        'data_source_id',
        'tab_key',
        'client_group_id',
        'client_id',
        'client_name',
        'client_group_name',
        'title',
        'summary',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];
}