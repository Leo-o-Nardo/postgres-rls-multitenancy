# PgSaaS Core  
**High-Performance Multi-Tenant SaaS Backend with PostgreSQL**

![PHP](https://img.shields.io/badge/PHP-8.2-777BB4?style=flat&logo=php)
![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?style=flat&logo=laravel)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker)
![Security](https://img.shields.io/badge/Security-Row%20Level%20Security-green)

---

## 📖 Overview

**PgSaaS Core** is a technical case study that demonstrates how to design a **secure, scalable, and database-centric multi-tenant SaaS backend**, with a strong focus on PostgreSQL advanced features.

The project simulates an **IoT data ingestion platform** (e.g., fuel pump or industrial sensor monitoring), handling large volumes of time-series data while enforcing **strict tenant isolation at the database level**.

Unlike traditional SaaS architectures that rely solely on application-level filters for multi-tenancy, this project adopts a **defense-in-depth approach**, pushing critical security and performance responsibilities down to the database engine.

---

## 🎯 Key Goals

- Demonstrate **database-level multi-tenancy** using PostgreSQL Row-Level Security (RLS)
- Handle **high-volume time-series data** using native table partitioning
- Offload heavy processing to the database via **PL/pgSQL**
- Integrate PostgreSQL cleanly with **Laravel 11**
- Provide a reproducible, production-like environment using **Docker Compose**

---

## 🚀 Core Features

### 🔐 Database-Level Multi-Tenancy (RLS)

Tenant isolation is enforced using **PostgreSQL Row-Level Security policies**.

Even if the application code:
- Forgets to apply a `WHERE tenant_id = ?`
- Attempts to query another tenant explicitly

👉 The database **blocks the operation**.

This eliminates an entire class of multi-tenant security bugs.

---

### ⚡ High-Performance Time-Series Data

Sensor data is stored in **range-partitioned tables**, partitioned by month.

Benefits:
- Query planner prunes irrelevant partitions
- Faster range queries on large datasets
- Simple data retention using `DROP PARTITION`

---

### 🧠 Database-Centric Processing (PL/pgSQL)

Batch processing and analytics are handled inside PostgreSQL using stored procedures.

Examples:
- Hourly aggregation of sensor data
- Calculation of averages and anomaly detection
- Writing pre-aggregated results into analytics tables

This reduces:
- Application complexity
- Network overhead
- API latency

---

### 🧩 Tenant Context Injection (Laravel Middleware)

A custom Laravel middleware injects the tenant context into the database session for every request:

```php
DB::statement(
    "SELECT set_config('app.current_tenant', ?, false)",
    [$tenantId]
);
```

PostgreSQL policies automatically apply this context, requiring **no tenant filtering in controllers or repositories**.

---

### 🐳 Production-Oriented Infrastructure

The project uses Docker Compose to simulate a real-world environment:

- PostgreSQL 16
- PHP-FPM (Laravel)
- Nginx as reverse proxy
- Persistent volumes for database and PgAdmin

This ensures:
- Environment reproducibility
- Clean separation between services
- Easy local setup

---

## 🏗 Architecture Decisions

### 1. Row-Level Security over Application-Level Filtering

Instead of trusting developers to always apply tenant filters, tenant isolation is enforced directly by PostgreSQL:

```sql
CREATE POLICY tenant_isolation_policy
ON sensors
USING (
  tenant_id::text = current_setting('app.current_tenant', true)
);
```

This guarantees isolation even in the presence of application bugs.

---

### 2. Native Table Partitioning for Time-Series Data

Sensor tables are partitioned by month to optimize performance and maintenance.

- Efficient range queries
- Partition pruning
- Simple archival and retention strategies

---

### 3. Application as Orchestrator, Not Data Owner

Laravel acts as:
- An orchestrator
- A security boundary
- An API layer

All critical data rules and constraints live in the database.

---

## 🛠 Installation & Setup

### Prerequisites
- Docker
- Docker Compose

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/pg-saas-core.git
cd pg-saas-core
```

### 2. Start the Environment

```bash
docker-compose up -d
```

---

### 3. Install Dependencies and Initialize the Database

Run the following commands inside the application container:

```bash
# Install PHP dependencies
docker-compose run --rm app composer install

# Fix permissions
docker-compose run --rm app chmod -R 775 storage bootstrap/cache

# Run migrations (schemas, RLS policies, partitions)
docker-compose run --rm app php artisan migrate

# (Optional) Seed sample tenants and sensors
docker-compose run --rm app php artisan db:seed
```

---

## 🧪 Testing & Validation

The test suite explicitly validates tenant isolation.

```bash
docker-compose run --rm app php artisan test
```

Expected output:

```
PASS  Tests\Feature\TenantSecurityTest
✓ tenant can only see their own data
✓ cross-tenant access is blocked by PostgreSQL
```

These tests intentionally attempt to bypass application-level logic to prove that **PostgreSQL enforces isolation**.

---

## 📂 Project Structure

```text
├── docker-compose.yml        # Environment orchestration
├── Dockerfile                # Custom PHP-FPM image
├── backend/                  # Laravel 11 application
│   ├── app/Http/Middleware/  # Tenant context injection
│   ├── database/migrations/  # Schema, RLS policies, partitions
│   └── tests/Feature/        # Security and isolation tests
└── docker/                   # Nginx configuration
```

---

## 👤 Author

**Leonardo Ferreira**  
Senior Full Stack Developer 
