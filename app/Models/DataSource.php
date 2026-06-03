<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DataSource extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'title',
        'image',
        'service',
        'is_connected',
        'total_connections',
        'is_active',
    ];

    protected $casts = [
        'is_connected' => 'boolean',
        'is_active' => 'boolean',
    ];
}
