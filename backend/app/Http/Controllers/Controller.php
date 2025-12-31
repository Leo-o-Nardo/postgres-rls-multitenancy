<?php

namespace App\Http\Controllers;

use OpenApi\Annotations as OA;

/**
 * @OA\Info(
 * version="1.0.0",
 * title="PgSaaS IoT API",
 * description="High-performance IoT Backend with RLS and Partitioning",
 * @OA\Contact(
 * email="seu-email@example.com"
 * )
 * )
 *
 * @OA\Server(
 * url=L5_SWAGGER_CONST_HOST,
 * description="API Server"
 * )
 */
abstract class Controller
{
    // ...
}
