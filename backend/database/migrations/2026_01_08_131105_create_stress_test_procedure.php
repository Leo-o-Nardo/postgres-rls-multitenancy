<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            CREATE OR REPLACE PROCEDURE stress_test_attack(p_tenant_id uuid, p_amount integer)
            LANGUAGE plpgsql
            AS $$
            DECLARE
                v_sensor_ids uuid[];
            BEGIN
                SELECT ARRAY_AGG(id) INTO v_sensor_ids
                FROM sensors
                WHERE tenant_id = p_tenant_id;

                IF v_sensor_ids IS NULL THEN
                    RAISE EXCEPTION 'Tenant % has no sensors to attack', p_tenant_id;
                END IF;

                INSERT INTO sensor_readings (id, sensor_id, tenant_id, value, created_at, updated_at)
                SELECT
                    gen_random_uuid(),
                    v_sensor_ids[ floor(random() * array_length(v_sensor_ids, 1) + 1)::int ],
                    p_tenant_id,
                    (random() * 100)::numeric(8,2),
                    NOW(),
                    NOW()
                FROM generate_series(1, p_amount);
            END;
            $$;
        ");
    }

    public function down(): void
    {
        DB::statement("DROP PROCEDURE IF EXISTS stress_test_attack(uuid, integer)");
    }
};
