<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SemrushAccount extends Model
{
    protected $fillable = [
        'user_id',
        'api_key',
        //'domain',
        'default_database',
        'status',
    ];

    protected $hidden = ['api_key'];

    protected $casts = [
        'api_key' => 'encrypted',
    ];

   public function sites()
    {
        return $this->hasMany(Site::class);
    }

    public function assignments()
    {
        return $this->hasMany(SemrushClientAssignment::class);
    }
}
