<?php

namespace App\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SimplifiAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'account_id',
        'name',
        'email',
        'api_key',
        'is_connected',
        'last_synced_at',
    ]; 

    /**
     * Relationship between user and SimplifiAccount
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<User, SimplifiAccount>
     */
    public function user(){
        return $this->belongsTo(User::class);
    }

    /**
     * Summary of organizations
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<SimplifiOrganizations, SimplifiAccount>
     */
    public function organizations()
    {
        return $this->hasMany(SimplifiOrganizations::class, 'account_id');
    }
}
