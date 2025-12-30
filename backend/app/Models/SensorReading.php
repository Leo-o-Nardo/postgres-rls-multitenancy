<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SensorReading extends Model
{
    public $timestamps = false;

    protected $fillable = ['sensor_id', 'tenant_id', 'value', 'metadata', 'created_at'];

    protected $casts = [
        'metadata' => 'array',
        'value' => 'decimal:2',
        'created_at' => 'datetime'
    ];
}
