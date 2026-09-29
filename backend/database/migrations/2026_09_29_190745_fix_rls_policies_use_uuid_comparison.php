<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const TABLES = ['sensors', 'sensor_readings'];

    public function up(): void
    {
        // Compara em uuid (sem cast na coluna) para o índice (tenant_id, created_at) ser usado.
        foreach (self::TABLES as $table) {
            DB::statement("DROP POLICY IF EXISTS tenant_isolation_policy ON {$table}");
            DB::statement("
                CREATE POLICY tenant_isolation_policy ON {$table}
                USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid)
                WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid)
            ");
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $table) {
            DB::statement("DROP POLICY IF EXISTS tenant_isolation_policy ON {$table}");
            DB::statement("
                CREATE POLICY tenant_isolation_policy ON {$table}
                USING (tenant_id::text = current_setting('app.current_tenant', true))
                WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true))
            ");
        }
    }
};