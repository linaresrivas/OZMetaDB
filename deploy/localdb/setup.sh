#!/bin/bash
#
# OZMetaDB Docker SQL Server Setup Script
#
# Steps:
#   1.1 Check Docker is running
#   1.2 Start SQL Server container
#   2.1 Wait for SQL Server to be ready
#   2.2 Create database
#   3.1 Run MetaDB schema DDL
#   3.2 Run seed data
#   4.1 Verify setup
#
# Usage:
#   ./setup.sh
#   ./setup.sh --database OZMetaDB_Dev
#

set -e

# Defaults
DATABASE_NAME="${DATABASE_NAME:-OZMetaDB}"
CONTAINER_NAME="${CONTAINER_NAME:-ozmetadb-sqlserver}"
SA_PASSWORD="${SA_PASSWORD:-OzMeta123!}"
SQL_PORT="${SQL_PORT:-1433}"

# Paths
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
SCHEMA_DDL="$REPO_ROOT/metadb/ddl/metadb-schema.sql"
SEED_SCRIPT="$REPO_ROOT/deploy/seed/01-bootstrap.sql"

echo "============================================"
echo "OZMetaDB Docker SQL Server Setup"
echo "============================================"
echo ""

# ============================================
# 1.1 Check Docker is running
# ============================================
echo "1.1 Checking Docker..."

if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker not found. Install Docker Desktop."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "ERROR: Docker daemon not running. Start Docker Desktop."
    exit 1
fi

echo "   Docker OK"

# ============================================
# 1.2 Start SQL Server container
# ============================================
echo "1.2 Starting SQL Server container..."

if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    # Container exists
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "   Container already running: $CONTAINER_NAME"
    else
        echo "   Starting existing container: $CONTAINER_NAME"
        docker start "$CONTAINER_NAME"
    fi
else
    echo "   Creating new container: $CONTAINER_NAME"
    docker run -d \
        --name "$CONTAINER_NAME" \
        -e "ACCEPT_EULA=Y" \
        -e "MSSQL_SA_PASSWORD=$SA_PASSWORD" \
        -p "$SQL_PORT:1433" \
        mcr.microsoft.com/mssql/server:2022-latest
fi

# ============================================
# 2.1 Wait for SQL Server to be ready
# ============================================
echo "2.1 Waiting for SQL Server to be ready..."

MAX_TRIES=30
for i in $(seq 1 $MAX_TRIES); do
    if docker exec "$CONTAINER_NAME" /opt/mssql-tools18/bin/sqlcmd \
        -S localhost -U sa -P "$SA_PASSWORD" -C -Q "SELECT 1" &> /dev/null; then
        echo "   SQL Server is ready"
        break
    fi
    if [ $i -eq $MAX_TRIES ]; then
        echo "ERROR: SQL Server did not become ready in time"
        exit 1
    fi
    echo "   Waiting... ($i/$MAX_TRIES)"
    sleep 2
done

# Helper function to run SQL
run_sql() {
    docker exec -i "$CONTAINER_NAME" /opt/mssql-tools18/bin/sqlcmd \
        -S localhost -U sa -P "$SA_PASSWORD" -C -d "${1:-master}" -b
}

run_sql_file() {
    cat "$2" | docker exec -i "$CONTAINER_NAME" /opt/mssql-tools18/bin/sqlcmd \
        -S localhost -U sa -P "$SA_PASSWORD" -C -d "$1" -b
}

# ============================================
# 2.2 Create database
# ============================================
echo "2.2 Creating database: $DATABASE_NAME"

echo "
IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = '$DATABASE_NAME')
BEGIN
    CREATE DATABASE [$DATABASE_NAME];
    PRINT 'Database created: $DATABASE_NAME';
END
ELSE
    PRINT 'Database exists: $DATABASE_NAME';
" | run_sql "master"

# ============================================
# 3.1 Run MetaDB schema DDL
# ============================================
echo "3.1 Running MetaDB schema DDL..."

if [ -f "$SCHEMA_DDL" ]; then
    echo "   Executing: $SCHEMA_DDL"
    run_sql_file "$DATABASE_NAME" "$SCHEMA_DDL"
    echo "   Schema DDL complete."
else
    echo "   WARNING: Schema DDL not found at: $SCHEMA_DDL"
fi

# ============================================
# 3.2 Run seed data
# ============================================
echo "3.2 Running seed data..."

if [ -f "$SEED_SCRIPT" ]; then
    echo "   Executing: $SEED_SCRIPT"
    run_sql_file "$DATABASE_NAME" "$SEED_SCRIPT"
    echo "   Seed data complete."
else
    echo "   WARNING: Seed script not found at: $SEED_SCRIPT"
fi

# ============================================
# 4.1 Verify setup
# ============================================
echo "4.1 Verifying setup..."

echo "
SELECT 'Schemas' as Category, COUNT(*) as [Count]
FROM sys.schemas WHERE name IN ('Meta','Audit','Doc','Sec')
UNION ALL
SELECT 'Tables', COUNT(*)
FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE s.name IN ('Meta','Audit','Doc','Sec');
" | run_sql "$DATABASE_NAME"

# ============================================
# Done
# ============================================
echo ""
echo "============================================"
echo "Setup complete!"
echo "============================================"
echo ""
echo "Connection string (for pyodbc):"
echo "  DRIVER={ODBC Driver 18 for SQL Server};SERVER=localhost,$SQL_PORT;DATABASE=$DATABASE_NAME;UID=sa;PWD=$SA_PASSWORD;TrustServerCertificate=yes"
echo ""
echo "To export a snapshot:"
echo "  export OZ_DB_CONNECTION='DRIVER={ODBC Driver 18 for SQL Server};SERVER=localhost,$SQL_PORT;DATABASE=$DATABASE_NAME;UID=sa;PWD=$SA_PASSWORD;TrustServerCertificate=yes'"
echo "  python generator/src/export_from_db.py --provider sqlserver --out snapshot.json"
echo ""
