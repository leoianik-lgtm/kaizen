# Kaizen Backend API

Backend Node.js + Express + SQLite para Azure App Service

## 🚀 Deploy via ZIP

### 1. Instalar dependências localmente
```bash
cd backend
npm install
```

### 2. Criar arquivo ZIP
Compactar TODA a pasta `backend/` incluindo:
- ✅ node_modules/
- ✅ src/
- ✅ server.js
- ✅ package.json

### 3. Deploy no Azure
```bash
az webapp deployment source config-zip \
  --resource-group <seu-resource-group> \
  --name kaizen \
  --src backend.zip
```

Ou via Azure Portal:
1. App Service → Deployment Center
2. FTPS credentials ou Local Git
3. Upload do ZIP

## 🔧 Configurações Importantes no App Service

### Configuration → General Settings
- ✅ **SCM Do Build During Deployment**: OFF
- ✅ **Run from package**: OFF (para permitir escrita no filesystem)

### Configuration → Application Settings
Adicionar se necessário:
- `DB_PATH`: `/home/data` (opcional, usa default se não definir)

## 📁 Estrutura do Banco SQLite

O arquivo `kaizens.db` será criado automaticamente em:
- **Linux**: `/home/site/wwwroot/data/kaizens.db`
- **Local**: `backend/data/kaizens.db`

## ⚠️ Importante

- **Apenas 1 instância**: SQLite não suporta múltiplas instâncias
- **Backup manual**: Criar rotina de backup do arquivo .db
- **WAL mode**: Ativado automaticamente para melhor performance

## 🧪 Testar Localmente

```bash
npm start
# Acesse: http://localhost:8080
# API: http://localhost:8080/api/kaizens
```