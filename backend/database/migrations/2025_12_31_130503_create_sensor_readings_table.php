<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            CREATE TABLE sensor_readings (
                id uuid NOT NULL,
                sensor_id uuid NOT NULL,
                tenant_id uuid NOT NULL,
                value numeric(8, 2) NOT NULL,
                created_at timestamp(0) without time zone NOT NULL,
                updated_at timestamp(0) without time zone NULL,

                -- A chave primária PRECISA incluir a chave de particionamento (created_at)
                PRIMARY KEY (id, created_at)
            ) PARTITION BY RANGE (created_at);
        ");

        DB::statement("CREATE INDEX idx_readings_tenant_time ON sensor_readings (tenant_id, created_at DESC)");
        DB::statement("CREATE INDEX idx_readings_analytics ON sensor_readings (tenant_id, created_at DESC) INCLUDE (value)");

        DB::statement("ALTER TABLE sensor_readings FORCE ROW LEVEL SECURITY");
        DB::statement("ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY");

        DB::statement("
            CREATE POLICY tenant_isolation_policy ON sensor_readings
            USING (tenant_id::text = current_setting('app.current_tenant', true))
            WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true))
        ");

        $start = now()->subYear(); // Um ano atrás
        for ($i = 0; $i < 24; $i++) {
            $date = $start->copy()->addMonths($i);
            $tableName = 'sensor_readings_' . $date->format('Y_m');
            $startRange = $date->format('Y-m-01');
            $endRange = $date->copy()->addMonth()->format('Y-m-01');

            DB::statement("
                CREATE TABLE IF NOT EXISTS {$tableName}
                PARTITION OF sensor_readings
                FOR VALUES FROM ('{$startRange}') TO ('{$endRange}')
            ");
        }

        DB::statement("
            CREATE TABLE sensor_readings_default
            PARTITION OF sensor_readings DEFAULT;
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('sensor_readings');
    }
};
