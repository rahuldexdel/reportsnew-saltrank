<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SemrushClientAssignment extends Model
{
    protected $fillable = [
        'semrush_account_id',
        'client_id',
        'domain',
        'database',
    ];

    public function semrushAccount()
    {
        return $this->belongsTo(SemrushAccount::class);
    }
    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    // public function site()
    // {
    //     return $this->hasMany(Site::class, 'domain', 'domain');
    // }

}
