<#
.SYNOPSIS
    OZMetaDB LocalDB Setup Script

.DESCRIPTION
    Steps:
      1.1 Check LocalDB is installed
      1.2 Create database instance
      2.1 Run MetaDB schema DDL
      2.2 Run seed data
      3.1 Verify setup

.PARAMETER DatabaseName
    Name of the database to create (default: OZMetaDB)

.PARAMETER InstanceName
    LocalDB instance name (default: MSSQLLocalDB)

.EXAMPLE
    .\setup.ps1
    .\setup.ps1 -DatabaseName "OZMetaDB_Dev"
#>

param(
    [string]$DatabaseName = "OZMetaDB",
    [string]$InstanceName = "MSSQLLocalDB"
)

$ErrorActionPreference = "Stop"

# Paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = (Get-Item $ScriptDir).Parent.Parent.FullName
$SchemaDDL = Join-Path $RepoRoot "metadb\ddl\metadb-schema.sql"
$SeedScript = Join-Path $RepoRoot "deploy\seed\01-bootstrap.sql"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "OZMetaDB LocalDB Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1.1 Check LocalDB is installed
# ============================================
Write-Host "1.1 Checking LocalDB installation..." -ForegroundColor Yellow

$sqllocaldb = Get-Command sqllocaldb -ErrorAction SilentlyContinue
if (-not $sqllocaldb) {
    Write-Error "LocalDB not found. Install SQL Server LocalDB from: https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/sql-server-express-localdb"
    exit 1
}

# Check instance exists
$instances = sqllocaldb info
if ($instances -notcontains $InstanceName) {
    Write-Host "   Creating LocalDB instance: $InstanceName" -ForegroundColor Gray
    sqllocaldb create $InstanceName
}

# Start instance
Write-Host "   Starting LocalDB instance..." -ForegroundColor Gray
sqllocaldb start $InstanceName | Out-Null

# ============================================
# 1.2 Create database
# ============================================
Write-Host "1.2 Creating database: $DatabaseName" -ForegroundColor Yellow

$connString = "Server=(localdb)\$InstanceName;Integrated Security=true;TrustServerCertificate=true"

$createDbSql = @"
IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = '$DatabaseName')
BEGIN
    CREATE DATABASE [$DatabaseName];
    PRINT 'Database created: $DatabaseName';
END
ELSE
BEGIN
    PRINT 'Database already exists: $DatabaseName';
END
"@

Invoke-Sqlcmd -ConnectionString $connString -Query $createDbSql

# ============================================
# 2.1 Run schema DDL
# ============================================
Write-Host "2.1 Running MetaDB schema DDL..." -ForegroundColor Yellow

$dbConnString = "Server=(localdb)\$InstanceName;Database=$DatabaseName;Integrated Security=true;TrustServerCertificate=true"

if (Test-Path $SchemaDDL) {
    Write-Host "   Executing: $SchemaDDL" -ForegroundColor Gray
    Invoke-Sqlcmd -ConnectionString $dbConnString -InputFile $SchemaDDL -ErrorAction Stop
    Write-Host "   Schema DDL complete." -ForegroundColor Green
} else {
    Write-Warning "Schema DDL not found at: $SchemaDDL"
}

# ============================================
# 2.2 Run seed data
# ============================================
Write-Host "2.2 Running seed data..." -ForegroundColor Yellow

if (Test-Path $SeedScript) {
    Write-Host "   Executing: $SeedScript" -ForegroundColor Gray
    Invoke-Sqlcmd -ConnectionString $dbConnString -InputFile $SeedScript -ErrorAction Stop
    Write-Host "   Seed data complete." -ForegroundColor Green
} else {
    Write-Warning "Seed script not found at: $SeedScript"
}

# ============================================
# 3.1 Verify setup
# ============================================
Write-Host "3.1 Verifying setup..." -ForegroundColor Yellow

$verifySql = @"
SELECT
    'Schemas' as Category, COUNT(*) as Count
FROM sys.schemas WHERE name IN ('Meta','Audit','Doc','Sec')
UNION ALL
SELECT
    'Tables' as Category, COUNT(*) as Count
FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE s.name IN ('Meta','Audit','Doc','Sec')
UNION ALL
SELECT
    'Clients' as Category, COUNT(*) as Count
FROM Meta.Client WHERE _DeleteDate IS NULL
UNION ALL
SELECT
    'Projects' as Category, COUNT(*) as Count
FROM Meta.Project WHERE _DeleteDate IS NULL
"@

$results = Invoke-Sqlcmd -ConnectionString $dbConnString -Query $verifySql
Write-Host ""
Write-Host "   Setup verification:" -ForegroundColor Cyan
$results | ForEach-Object { Write-Host "   - $($_.Category): $($_.Count)" -ForegroundColor White }

# ============================================
# Done
# ============================================
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Connection string:" -ForegroundColor Cyan
Write-Host "  $dbConnString" -ForegroundColor White
Write-Host ""
Write-Host "To export a snapshot:" -ForegroundColor Cyan
Write-Host "  python generator/src/export_from_db.py --provider sqlserver --connection `"$dbConnString`" --out snapshot.json" -ForegroundColor White
