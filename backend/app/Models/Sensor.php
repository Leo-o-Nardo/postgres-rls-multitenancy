<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Sensor extends Model
{
    use HasFactory, HasUuids;

    public $timestamps = false;
    protected $fillable = ['name', 'type', 'status', 'tenant_id'];
    protected $hidden = ['tenant_id'];

    public function readings()
    {
        return $this->hasMany(SensorReading::class);
    }
}
