// DomusVita Azure Infrastructure using Bicep
// Deploy with: az deployment group create --resource-group <rg-name> --template-file main.bicep

@description('Name of the application')
param appName string = 'domusvita'

@description('Location for all resources')
param location string = resourceGroup().location

@description('App Service Plan SKU')
@allowed(['F1', 'B1', 'B2', 'S1', 'S2', 'P1V2'])
param sku string = 'B1'

@description('Name of existing PostgreSQL server')
param databaseServerName string

@description('Name of the database')
param databaseName string = 'domusvita'

@description('Database admin username')
param databaseAdminLogin string

@secure()
@description('Database admin password')
param databaseAdminPassword string

@secure()
@description('Emergent LLM API Key')
param emergentLlmKey string

var appServicePlanName = '${appName}-plan'
var backendAppName = '${appName}-api'
var frontendAppName = '${appName}-web'
var storageAccountName = replace('${appName}storage', '-', '')
var containerName = 'documents'

// Storage Account for Documents
resource storageAccount 'Microsoft.Storage/storageAccounts@2021-09-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    allowBlobPublicAccess: false
  }
}

// Blob Container
resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2021-09-01' = {
  parent: storageAccount
  name: 'default'
}

resource container 'Microsoft.Storage/storageAccounts/blobServices/containers@2021-09-01' = {
  parent: blobService
  name: containerName
  properties: {
    publicAccess: 'None'
  }
}

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2021-03-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: sku
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

// Backend App Service
resource backendApp 'Microsoft.Web/sites@2021-03-01' = {
  name: backendAppName
  location: location
  kind: 'app,linux,container'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'DOCKER|domusvita/backend:latest'
      appSettings: [
        {
          name: 'DATABASE_URL'
          value: 'postgresql+asyncpg://${databaseAdminLogin}:${databaseAdminPassword}@${databaseServerName}.postgres.database.azure.com:5432/${databaseName}'
        }
        {
          name: 'AZURE_STORAGE_CONNECTION_STRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
        }
        {
          name: 'AZURE_STORAGE_CONTAINER_NAME'
          value: containerName
        }
        {
          name: 'EMERGENT_LLM_KEY'
          value: emergentLlmKey
        }
        {
          name: 'CORS_ORIGINS'
          value: 'https://${frontendAppName}.azurewebsites.net'
        }
        {
          name: 'WEBSITES_PORT'
          value: '8000'
        }
      ]
      alwaysOn: sku != 'F1'
    }
    httpsOnly: true
  }
}

// Frontend App Service
resource frontendApp 'Microsoft.Web/sites@2021-03-01' = {
  name: frontendAppName
  location: location
  kind: 'app,linux,container'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'DOCKER|domusvita/frontend:latest'
      appSettings: [
        {
          name: 'REACT_APP_BACKEND_URL'
          value: 'https://${backendAppName}.azurewebsites.net'
        }
      ]
      alwaysOn: sku != 'F1'
    }
    httpsOnly: true
  }
  dependsOn: [
    backendApp
  ]
}

// Outputs
output frontendUrl string = 'https://${frontendApp.properties.defaultHostName}'
output backendUrl string = 'https://${backendApp.properties.defaultHostName}'
output storageAccountName string = storageAccount.name
