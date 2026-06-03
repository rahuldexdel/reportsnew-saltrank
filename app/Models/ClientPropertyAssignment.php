<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientPropertyAssignment extends Model
{
    protected $fillable = [
        'client_id',
        'property_id',
    ];

    public function property()
    {
        return $this->belongsTo(GoogleServiceProperty::class, 'property_id');
    }
}
