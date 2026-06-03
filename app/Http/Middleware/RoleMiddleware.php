<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();

       // dd( $roles);
        if (! $user || ! in_array($user->user_role, $roles)) {
            abort(Response::HTTP_FORBIDDEN, 'Unauthorized access.');
        }

        return $next($request);
    }
}
