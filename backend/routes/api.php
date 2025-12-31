<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\Sensor;
use App\Models\Tenant;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::get('/ping', function () {
    return ['status' => 'ok'];
});

Route::middleware(['tenant.context'])->get('/sensors', function () {
    return Sensor::all();
});

Route::get('/tenants', function () {
    return Tenant::select('id', 'name')->get();
});

Route::middleware(['tenant.context'])->group(function () {
    Route::post('/stress/start', [\App\Http\Controllers\StressController::class, 'startAttack']);
    Route::get('/stress/stats', [\App\Http\Controllers\StressController::class, 'stats']);
});
