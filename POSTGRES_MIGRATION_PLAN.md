# PostgreSQL Migration Plan for A1 Fitness Zone CRM

## 1. Schema Compatibility Analysis
The current `prisma/schema.prisma` uses standard cross-database features:
- `String @id @default(uuid())`: Fully supported in PostgreSQL as `TEXT` UUIDs.
- `DateTime`: Maps to `TIMESTAMP(3)` in PostgreSQL without issues.
- `Float`: Maps to `DOUBLE PRECISION`. No complex SQLite-specific types (like `BLOB` or `JSON`) were used, ensuring a 1:1 structural transition.

## 2. Configuration Strategy
1. **Environment Variables**:
   In production, set the following environment variables:
   ```env
   DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
   SESSION_SECRET="your_strong_random_secret"
   ```
2. **Schema Update**:
   Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

## 3. Migration Procedure
To prevent data loss, follow this procedure on the production server during a scheduled maintenance window:

1. **Baseline the PostgreSQL Schema**:
   Since the existing `prisma/migrations` folder contains SQLite-specific SQL commands, delete the folder entirely.
   ```bash
   rm -rf prisma/migrations
   npx prisma migrate dev --name init_postgres
   ```
   This creates a fresh, PostgreSQL-optimized migration history.

2. **Data Preservation & Transfer**:
   To move the existing `dev.db` SQLite data to the new PostgreSQL instance, use `pgloader`, a robust open-source data migration tool:
   ```bash
   pgloader sqlite://path/to/dev.db postgresql://user:password@host/database
   ```
   Alternatively, write a custom Node.js script using two Prisma clients (one SQLite, one PostgreSQL) to read and transfer records sequentially (Members -> Plans -> Memberships -> Payments -> Allocations).

## 4. Rollback and Recovery
- **Pre-Migration Backup**: Always copy `dev.db` to a secure backup location (e.g., `dev.db.bak`) before starting the migration.
- **Rollback**: If the PostgreSQL deployment fails, simply revert the `schema.prisma` provider back to `"sqlite"`, restore `DATABASE_URL` to point to the `dev.db` backup, and restart the Next.js server. No data will be lost since the original SQLite file remains intact.
- **PostgreSQL Backups**: Once on Postgres, utilize `pg_dump` on a cron schedule to ensure continuous data recovery capabilities.

## 5. Security & Build Readiness
- Do not deploy this application as a static site (`next export`). It requires a Node.js runtime to execute Server Actions and middleware.
- Ensure the production environment is served over HTTPS to protect the `Secure` HTTP-only session cookies.
