<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SearchConsoleSite extends Model
{
    use HasFactory;
    protected $table = 'search_console_sites';
    protected $fillable = [
        'google_account_id',
        'site_url',
        'permission_level',
        'last_crawled_at',
    ];

    public function googleAccount()
    {
        return $this->belongsTo(GoogleAccount::class);
    }
}
