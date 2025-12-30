<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\Sensor;

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
