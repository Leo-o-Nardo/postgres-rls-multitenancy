<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Tenant;
use App\Models\Sensor;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\RefreshDatabase;

class TenantSecurityTest extends TestCase
{
    use RefreshDatabase;
    use DatabaseTransactions;

    public function test_tenant_can_only_see_their_own_sensors()
    {
        $tenantA = Tenant::factory()->create();
        DB::statement("SELECT set_config('app.current_tenant', ?, false)", [$tenantA->id]);
        $sensorA = Sensor::factory()->create(['tenant_id' => $tenantA->id, 'name' => 'Sensor Exclusivo A']);

        $tenantB = Tenant::factory()->create();
        DB::statement("SELECT set_config('app.current_tenant', ?, false)", [$tenantB->id]);
        $sensorB = Sensor::factory()->create(['tenant_id' => $tenantB->id, 'name' => 'Sensor Exclusivo B']);

        $response = $this->withHeaders(['X-Tenant-ID' => $tenantA->id])->getJson('/api/sensors');

        $response->assertStatus(200);
        $response->assertJsonFragment(['name' => 'Sensor Exclusivo A']);
        $response->assertJsonMissing(['name' => 'Sensor Exclusivo B']);
    }

    public function test_request_without_header_is_blocked()
    {
        $response = $this->getJson('/api/sensors');
        $response->assertStatus(403);
    }
}
