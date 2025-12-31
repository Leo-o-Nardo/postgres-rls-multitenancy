<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('plan_type')->default('basic');
            $table->timestamps();
        });

        // DB::statement("ALTER TABLE tenants FORCE ROW LEVEL SECURITY");
        // DB::statement("ALTER TABLE tenants ENABLE ROW LEVEL SECURITY");

        // DB::statement("
        //     CREATE POLICY tenant_isolation_policy ON tenants
        //     USING (id::text = current_setting('app.current_tenant', true))
        // ");
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
