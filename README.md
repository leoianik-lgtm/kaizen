# Kaizen - Aplicação Corporativa Volvo Group

## Configuração do Azure Static Web App

### Pré-requisitos
- Conta Azure ativa
- Repositório GitHub
- Azure CLI instalado

### Passos para Deploy

#### 1. Criar o Static Web App no Azure Portal

1. Acesse o [Azure Portal](https://portal.azure.com)
2. Clique em "Criar um recurso"
3. Procure por "Static Web App"
4. Preencha as informações:
   - **Subscription**: Sua assinatura
   - **Resource Group**: Crie um novo ou use existente
   - **Name**: kaizen-app (ou nome de sua escolha)
   - **Plan type**: Free (para desenvolvimento)
   - **Region**: East US 2 (ou mais próxima)
   - **Source**: GitHub
   - **GitHub account**: Sua conta
   - **Organization**: Sua organização
   - **Repository**: kaizen
   - **Branch**: main
   - **Build Presets**: Custom
   - **App location**: /
   - **Output location**: /

#### 2. Configurar Autenticação Microsoft

Após criar o Static Web App:

1. No Azure Portal, vá para o recurso criado
2. Clique em "Authentication" no menu lateral
3. Clique em "Add identity provider"
4. Selecione "Microsoft"
5. Configure:
   - **App registration type**: Create new app registration
   - **Name**: kaizen-auth
   - **Supported account types**: Current tenant - Single tenant
   - **Redirect URI**: Será preenchido automaticamente

#### 3. Configurar Variáveis de Ambiente

No Azure Portal, no seu Static Web App:
1. Vá para "Configuration"
2. Adicione as seguintes variáveis:
   - `AZURE_CLIENT_ID`: (será fornecido após configurar a autenticação)
   - `AZURE_CLIENT_SECRET`: (será fornecido após configurar a autenticação)

### Estrutura do Projeto

```
kaizen/
├── index.html                    # Página principal
├── staticwebapp.config.json      # Configuração de autenticação e rotas
├── .github/
│   └── workflows/
│       └── azure-static-web-apps.yml  # CI/CD Pipeline
└── README.md                     # Este arquivo
```

### Funcionalidades

- ✅ Autenticação Microsoft (Azure AD)
- ✅ Acesso restrito a colaboradores
- ✅ Deploy automático via GitHub Actions
- ✅ Configuração de segurança (CSP, headers)
- ✅ Interface responsiva

### Próximos Passos

1. Fazer push do código para o GitHub
2. O deploy será automático via GitHub Actions
3. Configurar a autenticação no Azure Portal
4. Testar o acesso com usuários corporativos