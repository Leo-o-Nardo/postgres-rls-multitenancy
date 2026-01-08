<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Tenant;
use App\Models\Sensor;
use App\Models\SensorReading;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        // User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        // ]);


        $totalTenants = 2;
        $sensorsPerTenant = 5;
        $readingsPerSensor = 10000;

        $tenants = Tenant::factory()->count($totalTenants)->create();

        foreach ($tenants as $tenant) {
            DB::statement("SET app.current_tenant = '{$tenant->id}'");

            $sensors = Sensor::factory()->count($sensorsPerTenant)->create(['tenant_id' => $tenant->id]);

            foreach ($sensors as $sensor) {
                $data = [];
                for ($i = 0; $i < $readingsPerSensor; $i++) {
                    $data[] = [
                        'id' => (string) \Illuminate\Support\Str::uuid(), // Gera UUID manualmente
                        'sensor_id' => $sensor->id,
                        'tenant_id' => $tenant->id,
                        'value' => rand(2000, 5000) / 100,
                        'created_at' => now()->subMinutes($i)->toDateTimeString(),
                        'updated_at' => now()->toDateTimeString(),
                    ];

                    if (count($data) >= 500) {
                        SensorReading::insert($data);
                        $data = [];
                    }
                }

                if (!empty($data)) {
                    SensorReading::insert($data);
                }
            }
        }

        DB::statement("RESET app.current_tenant");
    }
}
