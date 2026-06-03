<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiSummary extends Model
{
    protected $fillable = [
        'client_id',
        'group_id',
        'tab',
        'month',
        'summary_text',
    ];
}