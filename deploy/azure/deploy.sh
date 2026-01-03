#!/bin/bash
#
# OZMetaDB Azure Deployment Script
#
# Steps:
#   1.1 Check Azure CLI is installed
#   1.2 Check logged in
#   2.1 Create resource group
#   2.2 Deploy Bicep template
#   3.1 Run schema DDL
#   3.2 Run seed data
#
# Usage:
#   ./deploy.sh --environment dev --password "YourSecurePassword123!"
#

set -e

# Defaults
ENVIRONMENT="${ENVIRONMENT:-dev}"
LOCATION="${LOCATION:-eastus}"
RESOURCE_GROUP="${RESOURCE_GROUP:-rg-ozmetadb-$ENVIRONMENT}"
SQL_PASSWORD=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --environment|-e) ENVIRONMENT="$2"; shift 2 ;;
        --location|-l) LOCATION="$2"; shift 2 ;;
        --resource-group|-g) RESOURCE_GROUP="$2"; shift 2 ;;
        --password|-p) SQL_PASSWORD="$2"; shift 2 ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

if [ -z "$SQL_PASSWORD" ]; then
    echo "ERROR: SQL password required. Use --password <password>"
    exit 1
fi

# Paths
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
BICEP_FILE="$SCRIPT_DIR/main.bicep"
PARAMS_FILE="$SCRIPT_DIR/parameters.$ENVIRONMENT.json"
SCHEMA_DDL="$REPO_ROOT/metadb/ddl/metadb-schema.sql"
SEED_SCRIPT="$REPO_ROOT/deploy/seed/01-bootstrap.sql"

echo "============================================"
echo "OZMetaDB Azure Deployment"
echo "============================================"
echo "Environment: $ENVIRONMENT"
echo "Location:    $LOCATION"
echo "RG:          $RESOURCE_GROUP"
echo ""

# ============================================
# 1.1 Check Azure CLI
# ============================================
echo "1.1 Checking Azure CLI..."

if ! command -v az &> /dev/null; then
    echo "ERROR: Azure CLI not found. Install from: https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
fi

# ============================================
# 1.2 Check logged in
# ============================================
echo "1.2 Checking Azure login..."

if ! az account show &> /dev/null; then
    echo "   Not logged in. Running az login..."
    az login
fi

SUBSCRIPTION=$(az account show --query name -o tsv)
echo "   Logged in to: $SUBSCRIPTION"

# ============================================
# 2.1 Create resource group
# ============================================
echo "2.1 Creating resource group: $RESOURCE_GROUP"

az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output none

# ============================================
# 2.2 Deploy Bicep template
# ============================================
echo "2.2 Deploying Bicep template..."

DEPLOYMENT_OUTPUT=$(az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --template-file "$BICEP_FILE" \
    --parameters "@$PARAMS_FILE" \
    --parameters sqlAdminPassword="$SQL_PASSWORD" \
    --output json)

SQL_SERVER=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.sqlServerFqdn.value')
SQL_DATABASE=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.sqlDatabaseName.value')

echo "   SQL Server: $SQL_SERVER"
echo "   Database:   $SQL_DATABASE"

# ============================================
# 3.1 Run schema DDL
# ============================================
echo "3.1 Running schema DDL..."

if [ -f "$SCHEMA_DDL" ]; then
    echo "   Executing: $SCHEMA_DDL"
    sqlcmd -S "$SQL_SERVER" -d "$SQL_DATABASE" \
        -U ozmetaadmin -P "$SQL_PASSWORD" \
        -i "$SCHEMA_DDL" \
        -C  # Trust server certificate
    echo "   Schema DDL complete."
else
    echo "   WARNING: Schema DDL not found"
fi

# ============================================
# 3.2 Run seed data
# ============================================
echo "3.2 Running seed data..."

if [ -f "$SEED_SCRIPT" ]; then
    echo "   Executing: $SEED_SCRIPT"
    sqlcmd -S "$SQL_SERVER" -d "$SQL_DATABASE" \
        -U ozmetaadmin -P "$SQL_PASSWORD" \
        -i "$SEED_SCRIPT" \
        -C
    echo "   Seed data complete."
else
    echo "   WARNING: Seed script not found"
fi

# ============================================
# Done
# ============================================
echo ""
echo "============================================"
echo "Deployment complete!"
echo "============================================"
echo ""
echo "Connection string:"
echo "  Server=tcp:$SQL_SERVER,1433;Database=$SQL_DATABASE;User ID=ozmetaadmin;Password=***;Encrypt=true;"
echo ""
echo "To export a snapshot:"
echo "  export OZ_DB_CONNECTION='DRIVER={ODBC Driver 18 for SQL Server};SERVER=$SQL_SERVER;DATABASE=$SQL_DATABASE;UID=ozmetaadmin;PWD=$SQL_PASSWORD;Encrypt=yes'"
echo "  python generator/src/export_from_db.py --provider sqlserver --out snapshot.json"
