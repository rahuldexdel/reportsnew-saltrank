<?php

// routes/api.php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Reports\DashboardController;
use App\Http\Controllers\Api\SemrushController;
use App\Http\Controllers\Reports\CallRailController;


  Route::post('dashboard/simpli-fi/webhook', [DashboardController::class, 'webhook']);
//  Route::get('/semrush/domain-overview', [SemrushController::class, 'domainOverview']);




