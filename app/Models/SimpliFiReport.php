<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SimpliFiReport extends Model
{
    // Optional: If your table is not plural (e.g., simpli_fi_report), uncomment this:
    // protected $table = 'simpli_fi_reports';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'report_id',
        'schedule_id',
        'filename',
        'report_data',
        'file_path',
        'download_url',
        'received_at',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'report_data' => 'array',  // Automatically decode JSON into array
        'received_at' => 'datetime',
    ];
}
