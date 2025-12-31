<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sensors', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id'); // FK para tenant
            $table->string('name');
            $table->string('type')->default('temperature');
            $table->string('status')->default('active');
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });

        // --- SEGURANÇA (RLS) ---
        DB::statement("ALTER TABLE sensors FORCE ROW LEVEL SECURITY");
        DB::statement("ALTER TABLE sensors ENABLE ROW LEVEL SECURITY");

        DB::statement("
            CREATE POLICY tenant_isolation_policy ON sensors
            USING (tenant_id::text = current_setting('app.current_tenant', true))
            WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true))
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('sensors');
    }
};
