<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class SetTenantContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenantId = $request->header('X-Tenant-ID');

        if (!$tenantId) {
            return response()->json(['error' => 'Tenant ID is required for access'], 403);
        }

        try {
            DB::statement("SELECT set_config('app.current_tenant', ?, false)", [$tenantId]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Database connection error'], 500);
        }

        return $next($request);
    }
}
