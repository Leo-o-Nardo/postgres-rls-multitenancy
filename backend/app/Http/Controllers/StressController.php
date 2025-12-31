<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\SensorReading;
use OpenApi\Annotations as OA;
use Illuminate\Support\Facades\Cache;

class StressController extends Controller
{
    /**
     * @OA\Post(
     * path="/api/stress/start",
     * tags={"Stress Test"},
     * summary="Triggers database load injection (Chaos Engineering)",
     * description="Inserts thousands of records to stress-test the PostgreSQL partitioning strategy and Row-Level Security (RLS) performance under load.",
     * @OA\Parameter(
     * name="X-Tenant-ID",
     * in="header",
     * required=true,
     * description="Target Tenant UUID for RLS context isolation",
     * @OA\Schema(type="string", format="uuid")
     * ),
     * @OA\RequestBody(
     * required=true,
     * description="Configuration for the load injection",
     * @OA\JsonContent(
     * required={"amount"},
     * @OA\Property(
     * property="amount",
     * type="integer",
     * example=1000,
     * description="Number of sensor readings to generate per batch"
     * )
     * )
     * ),
     * @OA\Response(
     * response="200",
     * description="Attack launched successfully",
     * @OA\JsonContent(
     * @OA\Property(property="status", type="string", example="Attack launched!"),
     * @OA\Property(property="rows", type="integer", example=1000)
     * )
     * ),
     * @OA\Response(
     * response="500",
     * description="Internal Server Error or Database Timeout"
     * )
     * )
     */
    public function startAttack(Request $request)
    {
        $tenantId = $request->header('X-Tenant-ID');
        $amount = $request->input('amount', 100); // Padrão: 10 mil linhas por clique

        DB::statement("CALL stress_test_attack(?, ?)", [$tenantId, $amount]);
        return response()->json(['status' => 'Attack launched!', 'rows' => $amount]);
    }

    public function stats(Request $request)
    {
        $tenantId = $request->header('X-Tenant-ID');

        if (!$tenantId) {
            return response()->json(['error' => 'X-Tenant-ID header required'], 400);
        }

        $stats = Cache::tags(['tenant_' . $tenantId])->remember('dashboard_stats', 2, function () use ($tenantId) {
            $start = microtime(true);
            $avgQuery = SensorReading::where('created_at', '>=', now()->subSeconds(10))->avg('value');

            $end = microtime(true);
            $queryTime = ($end - $start) * 1000; // milissegundos

            $totalRows = SensorReading::count();
            $writeSpeed = SensorReading::where('created_at', '>=', now()->subSeconds(5))->count() / 5;

            return [
                'write_speed' => round($writeSpeed),
                'read_latency_ms' => round($queryTime, 2),
                'total_rows' => $totalRows
            ];
        });

        return response()->json($stats);
    }
}
