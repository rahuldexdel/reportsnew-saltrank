<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SemrushService;
use Illuminate\Http\Request;

class SemrushController extends Controller
{
    public function domainOverview(Request $request, SemrushService $semrush)
    {
        $request->validate([
            'domain' => 'required|string',
        ]);

        return response()->json(
            $semrush->domainOverview($request->domain)
        );
    }
}
