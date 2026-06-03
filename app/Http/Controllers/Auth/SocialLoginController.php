<?php

namespace App\Http\Controllers\Auth;

use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Laravel\Socialite\Facades\Socialite;

class SocialLoginController extends Controller
{
    public function redirect($provider)
    {
        return Socialite::driver($provider)
            ->with([
                'prompt' => 'select_account',
                'access_type' => 'offline',
                'include_granted_scopes' => 'true',
            ])
            ->redirect();
    }

    public function callback($provider)
    {
        try {
            $socialUser = Socialite::driver($provider)
                ->stateless()
                ->user();

            $user = User::updateOrCreate(
                [
                    'email' => $socialUser->getEmail()
                ],
                [
                    'name' => $socialUser->getName(),
                    'first_name' => $socialUser->getName(),
                    'last_name' => $socialUser->getName(), // Update if needed
                    'email_verified_at' => now(),
                    'avatar' => $socialUser->getAvatar(),
                    'password' => bcrypt(Str::random(16)),
                    'provider' => $provider,
                    'provider_id' => $socialUser->getId(),
                ]
            );
            auth()->login($user, true);

            return redirect()->intended('/dashboard');

        } catch (\Exception $e) {
            return redirect()->route('login')->with('error', 'Something went wrong! ' . $e->getMessage());
        }
    }
}
