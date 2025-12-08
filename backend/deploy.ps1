# Script PowerShell para deploy do backend no Azure App Service

Write-Host "🚀 Kaizen Backend - Deploy Script" -ForegroundColor Green
Write-Host ""

# 1. Instalar dependências
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed" -ForegroundColor Red
    exit 1
}

# 2. Criar ZIP
Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow
$zipFile = "kaizen-backend.zip"

if (Test-Path $zipFile) {
    Remove-Item $zipFile
}

# Compactar tudo exceto arquivos desnecessários
Compress-Archive -Path `
    package.json, `
    server.js, `
    src, `
    node_modules `
    -DestinationPath $zipFile

Write-Host "✅ Package created: $zipFile" -ForegroundColor Green
Write-Host ""

# 3. Instruções de deploy
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Go to Azure Portal"
Write-Host "2. Navigate to App Service 'kaizen'"
Write-Host "3. Go to 'Deployment Center'"
Write-Host "4. Choose 'FTPS credentials' or use Azure CLI:"
Write-Host ""
Write-Host "   az webapp deployment source config-zip \" -ForegroundColor Yellow
Write-Host "     --resource-group <your-rg> \" -ForegroundColor Yellow
Write-Host "     --name kaizen \" -ForegroundColor Yellow
Write-Host "     --src $zipFile" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ Deployment package ready!" -ForegroundColor Green