/*
  OZMetaDB Azure SQL Deployment

  Steps:
    1.1 Create resource group (if needed)
    1.2 Create SQL Server
    2.1 Create SQL Database
    2.2 Configure firewall rules
    3.1 Output connection info

  Usage:
    az deployment group create \
      --resource-group rg-ozmetadb-dev \
      --template-file main.bicep \
      --parameters environmentName=dev sqlAdminPassword=<password>
*/

@description('Environment name (dev, test, prod)')
@allowed(['dev', 'test', 'prod'])
param environmentName string = 'dev'

@description('Azure region for resources')
param location string = resourceGroup().location

@description('SQL Server admin username')
param sqlAdminLogin string = 'ozmetaadmin'

@description('SQL Server admin password')
@secure()
param sqlAdminPassword string

@description('SQL Database SKU name')
param sqlSkuName string = 'Basic'

@description('SQL Database DTU/vCore capacity')
param sqlCapacity int = 5

@description('Allow Azure services to access SQL Server')
param allowAzureServices bool = true

@description('Client IP to allow (optional)')
param clientIpAddress string = ''

// ============================================
// Variables
// ============================================
var prefix = 'ozmetadb'
var sqlServerName = '${prefix}-sql-${environmentName}-${uniqueString(resourceGroup().id)}'
var sqlDatabaseName = 'OZMetaDB'
var tags = {
  Environment: environmentName
  Application: 'OZMetaDB'
  ManagedBy: 'Bicep'
}

// ============================================
// 1.2 SQL Server
// ============================================
resource sqlServer 'Microsoft.Sql/servers@2023-05-01-preview' = {
  name: sqlServerName
  location: location
  tags: tags
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }
}

// ============================================
// 2.2 Firewall: Allow Azure Services
// ============================================
resource firewallAllowAzure 'Microsoft.Sql/servers/firewallRules@2023-05-01-preview' = if (allowAzureServices) {
  parent: sqlServer
  name: 'AllowAllAzureIps'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// Firewall: Allow client IP (if provided)
resource firewallClientIp 'Microsoft.Sql/servers/firewallRules@2023-05-01-preview' = if (!empty(clientIpAddress)) {
  parent: sqlServer
  name: 'AllowClientIp'
  properties: {
    startIpAddress: clientIpAddress
    endIpAddress: clientIpAddress
  }
}

// ============================================
// 2.1 SQL Database
// ============================================
resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-05-01-preview' = {
  parent: sqlServer
  name: sqlDatabaseName
  location: location
  tags: tags
  sku: {
    name: sqlSkuName
    capacity: sqlCapacity
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: 2147483648 // 2GB
    zoneRedundant: environmentName == 'prod'
    requestedBackupStorageRedundancy: environmentName == 'prod' ? 'Geo' : 'Local'
  }
}

// ============================================
// 3.1 Outputs
// ============================================
output sqlServerName string = sqlServer.name
output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName
output sqlDatabaseName string = sqlDatabase.name
output connectionString string = 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Database=${sqlDatabaseName};User ID=${sqlAdminLogin};Encrypt=true;TrustServerCertificate=false;Connection Timeout=30;'
