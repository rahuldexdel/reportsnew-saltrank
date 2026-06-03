<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'name',
        'phone',
        'email',
        'avatar',
        'user_role',
        'status',
        'company_name',
        'time_zone',
        'password',
        'provider',
        'provider_id',
        'client_id',
        'client_Groups_id',
        'data_profile',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public const STATUSES = [
        'Active' => 'Active',
        'Inactive' => 'Inactive',
    ];

    public const USER_ROLES = [ 
        'Super Admin' => 'Super Admin',
        'Agent' => 'Agent',
        'Client' => 'Client',
       // 'Business Unit Admin' => 'Business Unit Admin',
    ];

    public function client()
    {
        return $this->belongsTo(\App\Models\Client::class);
    }


}