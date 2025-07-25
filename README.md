# 📱 App Despesas - Controle Financeiro Inteligente

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![GitHub stars](https://img.shields.io/github/stars/eduardoks98/app-despesas.svg)](https://github.com/eduardoks98/app-despesas/stargazers)
[![React Native](https://img.shields.io/badge/React%20Native-0.79.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-53.0.20-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1-blue.svg)](https://www.typescriptlang.org/)
[![Clean Architecture](https://img.shields.io/badge/Clean%20Architecture-DDD-green.svg)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

Um aplicativo completo de controle financeiro desenvolvido com **Clean Architecture + DDD**, React Native e Expo. Oferece gestão avançada de despesas, receitas, parcelamentos e assinaturas com recursos profissionais e arquitetura escalável para mobile e web.

## 🏗️ **Nova Arquitetura - Clean Architecture + DDD + API Premium**

Este projeto foi completamente refatorado para usar **Clean Architecture** com **Domain-Driven Design** (DDD) e **modelo freemium**, proporcionando:

### 🎯 **Arquitetura Moderna**
- ✅ **70% de código compartilhado** entre mobile e web
- ✅ **Testes unitários** simples e isolados  
- ✅ **TypeScript strict** com type safety completo
- ✅ **Manutenibilidade** com separação clara de responsabilidades
- ✅ **Escalabilidade** para adicionar novas features rapidamente

### 💰 **Modelo Freemium Implementado**
- 🆓 **Gratuito:** Dados locais SQLite no mobile
- 💎 **Premium:** Sincronização MySQL + API + Web App + Conta Família

### 📚 **Documentação Completa**
- 📖 **[Arquitetura Clean + DDD](./roadmaps/NOVA_ARQUITETURA.md)**
- 🚀 **[Roadmap Freemium Completo](./roadmaps/ROADMAP_FREEMIUM_COMPLETO.md)**
- 🏗️ **[Arquitetura de Hospedagem](./roadmaps/ARQUITETURA_HOSPEDAGEM_COMPLETA.md)**
- 🔒 **[Segurança e Criptografia](./roadmaps/SEGURANCA_CRIPTOGRAFIA_COMPLETA.md)**

## 💰 Como Obter o App

### Opção 1: App Oficial nas Lojas (Em Breve)
**Suporte o desenvolvimento comprando a versão oficial:**

*Em desenvolvimento - em breve disponível para:*
- Google Play Store (Android)
- Apple App Store (iOS)

**Vantagens da versão oficial:**
- ✅ Instalação com 1 clique
- ✅ Atualizações automáticas
- ✅ Suporte técnico prioritário
- ✅ Apoie o desenvolvimento contínuo

### Opção 2: Desenvolvimento Local (100% Gratuito)

#### 🚀 **Teste Rápido com Expo**

```bash
# Clone o repositório
git clone https://github.com/eduardoks98/app-despesas.git
cd app-despesas

# Instale as dependências
npm install

# 📱 MOBILE - Inicie o servidor de desenvolvimento
npm run start:mobile
# Use o app Expo Go para testar no seu dispositivo

# 🌐 WEB - Inicie a versão web (futuro)
npm run start:web
# Abre automaticamente no navegador
```

#### 🔧 **Build para Produção**

```bash
# Para Android
npm run build:mobile
# O APK estará em: android/app/build/outputs/apk/

# Para iOS (requer Mac)
npm run build:mobile
```

📖 **[Guia Completo de Desenvolvimento](#-desenvolvimento-local)**

## 🚀 Funcionalidades Principais

### 💰 Gestão Financeira Completa

- **Transações**: Adicione despesas e receitas com categorização inteligente
- **Parcelamentos**: Controle compras parceladas com cálculos automáticos
- **Assinaturas**: Gerencie serviços recorrentes (Netflix, Spotify, etc.)
- **Categorias**: Sistema flexível de categorização personalizável

### 📊 Relatórios e Análises

- **Dashboard Interativo**: Visão geral das suas finanças
- **Gráficos Dinâmicos**: Análise visual de gastos por período
- **Relatórios Detalhados**: Exportação em PDF
- **Métricas Avançadas**: Insights sobre seus padrões de gasto

### 🔔 Notificações Inteligentes

- **Lembretes Personalizáveis**: Para pagamentos e vencimentos
- **Notificações Push**: Alertas em tempo real
- **Configurações Flexíveis**: Horários e frequências personalizáveis

### 🔒 Backup e Segurança

- **Backup Automático**: Sistema de backup configurável
- **Exportação de Dados**: Backup manual em JSON
- **Dados Locais**: Privacidade garantida
- **Restauração**: Recuperação de dados

### 🎨 Interface Moderna

- **Design Responsivo**: Adaptável a diferentes telas
- **Temas**: Suporte a modo claro/escuro
- **Navegação Intuitiva**: Interface amigável
- **Animações**: Experiência fluida

## 🛠️ Tecnologias e Arquitetura

### 🏗️ **Arquitetura (Clean Architecture + DDD)**

```
┌─────────────────────────────────────────┐
│               PRESENTATION              │ ← React Components, Hooks
├─────────────────────────────────────────┤
│               APPLICATION               │ ← Use Cases, Business Logic
├─────────────────────────────────────────┤
│                 DOMAIN                  │ ← Entities, Value Objects
├─────────────────────────────────────────┤
│             INFRASTRUCTURE              │ ← Repositories, External APIs
└─────────────────────────────────────────┘
```

### 🚀 **Core Technologies**

- **React Native 0.79.5** - Framework mobile multiplataforma
- **Expo SDK 53** - Plataforma de desenvolvimento
- **TypeScript 5.1** - Tipagem estática strict
- **React Navigation 6** - Navegação declarativa

### 🏢 **Monorepo Structure**

```
app-despesas/
├── apps/
│   ├── mobile/          # React Native App
│   └── web/             # Web App (Next.js/Vite)
├── packages/
│   ├── core/            # Business Logic (Domain + Use Cases)
│   └── shared/          # Shared Components & Utils
```

### 🎨 **UI/UX**

- **React Native Paper** - Material Design 3
- **React Native Chart Kit** - Gráficos interativos
- **Expo Linear Gradient** - Gradientes visuais
- **Expo Vector Icons** - Iconografia completa

### 💾 **Data & Storage (Hybrid Architecture)**

- **MySQL** - Banco principal na VPS com API REST
- **SQLite** - Cache local offline (mobile)
- **IndexedDB** - Cache local offline (web)
- **Repository Pattern** - Abstração para alternar online/offline
- **Sincronização Automática** - Sync quando conectado

#### 🌐 **API-First Architecture**
```
📱 Mobile App  ←→  🌐 REST API  ←→  🗄️ MySQL (VPS)
     ↓                                      ↑
 💾 SQLite Cache  ←─── Sync quando online ──┘
```

### 📱 **Mobile Features**

- **Expo Notifications** - Push notifications
- **Expo Sharing** - Compartilhamento nativo
- **Expo Print** - PDF generation
- **Expo Haptics** - Feedback tátil
- **Expo File System** - Manipulação de arquivos

## 📱 Compatibilidade

- **Android**: 6.0+ (API 23+)
- **iOS**: 12.0+
- **Expo SDK**: 53
- **React Native**: 0.79.5

## 🚀 Desenvolvimento Local

### 📋 **Pré-requisitos**

- **Node.js 18+** 
- **npm** ou yarn
- **Expo CLI**: `npm install -g @expo/cli`
- **Expo Go** app no seu dispositivo ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) | [iOS](https://apps.apple.com/app/expo-go/id982107779))

### ⚡ **Setup Rápido**

```bash
# 1. Clone o repositório
git clone https://github.com/eduardoks98/app-despesas.git
cd app-despesas

# 2. Instale as dependências
npm install --workspaces

# 3. Configure as variáveis de ambiente
cp env.example .env
# Edite o arquivo .env com suas configurações
```

### 📱 **Executando o Mobile (React Native)**

```bash
# Inicie o servidor de desenvolvimento
npm run start:mobile

# OU diretamente no mobile
cd apps/mobile
npm start

# Escaneie o QR code com o app Expo Go
# OU execute em emulador:
npm run android  # Android
npm run ios      # iOS (requer Mac)
```

### 🌐 **Executando a Web (Future)**

```bash
# Quando implementada, a versão web será:
npm run start:web

# OU
cd apps/web
npm run dev
```

### 🏗️ **Testando a Nova Arquitetura**

```bash
# Buildar o core package
cd packages/core
npm run build

# Executar testes
npm test

# Type checking
npm run type-check
```

### 🗄️ **Configuração da API Premium + MySQL**

A API Premium permite sincronização, versão web e recursos avançados:

#### **🚀 Setup Automático na VPS (Apache):**

```bash
# Na sua VPS Ubuntu com Apache
sudo chmod +x deploy-apache-mysys.sh
sudo ./deploy-apache-mysys.sh
```

#### **📋 Setup Manual:**

```bash
# 1. Clone o projeto na sua VPS
git clone https://github.com/eduardoks98/app-despesas.git
cd app-despesas

# 2. Configure as variáveis de ambiente
cd apps/api
cp .env.example .env
# Edite o .env com suas configurações MySQL

# 3. Execute o setup do banco
npm run migrate

# 4. Inicie a API
npm run dev
```

#### **🌐 URLs Disponíveis (após deploy):**

```bash
# Landing page: https://mysys.shop
# Web App:      https://app.mysys.shop
# API:          https://api.mysys.shop
# Docs:         https://docs.mysys.shop/api-docs
# Billing:      https://billing.mysys.shop
```

#### 📡 **API Documentation (Swagger)**

A API possui documentação completa com Swagger:

- **Desenvolvimento:** `http://localhost:3001/api-docs`
- **Produção:** `https://docs.mysys.shop/api-docs`

#### **Principais Endpoints:**

```bash
# Autenticação
POST   /api/auth/register          # Registro de usuário
POST   /api/auth/login             # Login JWT
POST   /api/auth/refresh           # Refresh token
GET    /api/auth/me                # Dados do usuário

# Transações (Premium only)
GET    /api/transactions           # Listar com filtros
POST   /api/transactions           # Criar transação
PUT    /api/transactions/:id       # Atualizar transação
DELETE /api/transactions/:id       # Deletar transação

# Health & Status
GET    /api/health                 # Status da API
GET    /api-docs.json              # OpenAPI spec
```

#### 🔐 **Configuração no App Mobile:**

```typescript
// .env no mobile
API_BASE_URL=https://api.mysys.shop
PLAN_TYPE=premium  # free, premium
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 📦 Build e Deploy

### Build Local

```bash
# Prebuild (gerar código nativo)
npm run prebuild

# Build Android
npm run build:android
```

### EAS Build (Recomendado)

```bash
# Build na nuvem
npx eas build -p android --profile preview

# Build de desenvolvimento
npx eas build -p android --profile development
```

### Scripts Disponíveis

```bash
# Desenvolvimento
npm start              # Iniciar servidor de desenvolvimento
npm run android        # Executar no Android
npm run ios           # Executar no iOS
npm run web           # Executar na web

# Build
npm run build:android     # Build Android (preview)
npm run build:android-dev # Build Android (development)
npm run prebuild         # Gerar código nativo

# Qualidade de Código
npm run lint            # Verificar código
npm run lint:fix        # Corrigir problemas de linting
npm run type-check      # Verificar tipos TypeScript
npm test               # Executar testes

# Utilitários
npm run clean          # Limpar e reinstalar dependências
npm run backup         # Criar backup
npm run deploy         # Deploy automático
```

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Testes em modo watch
npm run test:watch

# Verificar cobertura
npm run test:coverage
```

### Estrutura de Testes

```
src/tests/
├── StorageService.test.ts    # Testes do serviço de armazenamento
├── components/               # Testes de componentes
├── services/                 # Testes de serviços
└── utils/                    # Testes de utilitários
```

## 🔧 Configurações Avançadas

### Variáveis de Ambiente

```bash
# Configurações do App
APP_NAME=App Despesas
APP_VERSION=1.0.0

# Analytics (opcional)
ANALYTICS_ENABLED=false
ANALYTICS_KEY=sua_chave_analytics

# Notificações
NOTIFICATION_ENABLED=true
DAILY_REMINDER_TIME=09:00

# Backup
BACKUP_ENABLED=true
BACKUP_FREQUENCY=daily
```

### Configurações do EAS

O projeto inclui configurações para diferentes perfis de build:

- **development**: Para desenvolvimento e testes
- **preview**: Para testes internos (APK)
- **production**: Para produção (AAB)

## 📊 Analytics e Monitoramento

O app inclui sistema de analytics para:

- 📈 Métricas de uso
- 🐛 Monitoramento de erros
- 📱 Performance do app
- 👥 Comportamento do usuário

### Eventos Rastreados

- Adição de despesas/receitas
- Criação de parcelamentos
- Geração de relatórios
- Uso de funcionalidades
- Navegação entre telas

## 🔒 Segurança e Privacidade

- ✅ **Dados Locais**: Todas as informações ficam no dispositivo
- ✅ **Backup Seguro**: Sistema de backup com criptografia
- ✅ **Validação**: Verificação de entrada de dados
- ✅ **Tratamento de Erros**: Sistema robusto de tratamento
- ✅ **Logs de Auditoria**: Rastreamento de ações importantes

## 📁 Estrutura do Projeto

```
app-despesas/
├── src/
│   ├── components/           # Componentes reutilizáveis
│   │   ├── common/          # Componentes básicos
│   │   ├── transactions/    # Componentes de transações
│   │   └── reports/         # Componentes de relatórios
│   ├── screens/             # Telas do aplicativo
│   │   ├── Home/           # Tela principal
│   │   ├── AddExpense/     # Adicionar despesa
│   │   ├── Reports/        # Relatórios
│   │   └── Settings/       # Configurações
│   ├── services/           # Serviços da aplicação
│   │   ├── storage/        # Armazenamento de dados
│   │   ├── notifications/  # Sistema de notificações
│   │   ├── analytics/      # Analytics
│   │   ├── backup/         # Sistema de backup
│   │   └── export/         # Exportação de dados
│   ├── context/            # Contextos React
│   ├── hooks/              # Hooks customizados
│   ├── types/              # Definições de tipos
│   ├── utils/              # Utilitários
│   └── styles/             # Estilos globais
├── assets/                 # Recursos estáticos
├── docs/                   # Documentação
├── scripts/                # Scripts utilitários
└── .github/                # Configurações GitHub Actions
```

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. **Fork o projeto**
2. **Crie uma branch** para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit suas mudanças** (`git commit -m 'Add some AmazingFeature'`)
4. **Push para a branch** (`git push origin feature/AmazingFeature`)
5. **Abra um Pull Request**

### Padrões de Código

- Use TypeScript para todos os arquivos
- Siga as convenções do ESLint
- Escreva testes para novas funcionalidades
- Documente funções complexas
- Use commits semânticos

## 🆚 Comparação de Versões

| Recurso | Self-Build | App Store (Em Breve) |
|---------|------------|------------|
| Código fonte | ✅ Completo | ✅ Completo |
| Todas as funcionalidades | ✅ | ✅ |
| Compilação manual | ✅ Necessária | ❌ |
| Atualizações | ✅ Manual | ✅ Automáticas |
| Suporte técnico | ❌ Comunidade | ✅ Prioritário |
| Instalação fácil | ❌ | ✅ |
| Contribui com o projeto | ❌ | ✅ |
| Preço | Grátis | A definir |

## 💚 Apoie via PIX

Gostou do app? Apoie o desenvolvimento!

**Chave PIX**: `4c988627-0741-4136-b6a4-8c2f793d21b1`

### PIX Recorrente Sugerido:
- ☕ **Café**: R$ 5/mês
- 🍕 **Pizza**: R$ 20/mês  
- 🚀 **Foguete**: R$ 50/mês

*Configure um PIX automático mensal no seu banco!*

<div align="center">
  <p><strong>Chave PIX:</strong> <code>4c988627-0741-4136-b6a4-8c2f793d21b1</code></p>
  
  <p><strong>💡 Como fazer PIX:</strong></p>
  <p>1️⃣ Copie a chave PIX acima</p>
  <p>2️⃣ Abra seu app do banco</p>
  <p>3️⃣ Escolha PIX → Enviar → Chave aleatória</p>
  <p>4️⃣ Cole a chave e escolha o valor</p>
</div>

## 🤝 Por Que Open Source + App Pago?

Este modelo permite:
- **Transparência Total**: Você pode ver exatamente como seus dados são tratados
- **Liberdade de Escolha**: Compile gratuitamente ou compre por conveniência
- **Desenvolvimento Sustentável**: A venda nas lojas financia melhorias contínuas
- **Comunidade Ativa**: Contribuições e melhorias de todos

## 📄 Licença

App Despesas é distribuído sob a GNU Affero General Public License v3.0 (AGPL-3.0).

### O que isso significa para você?

**Se você é usuário:**
- ✅ Pode usar o app livremente
- ✅ Pode compilar sua própria versão
- ✅ Pode modificar para uso pessoal
- ✅ Seus dados permanecem privados

**Se você é desenvolvedor:**
- ✅ Pode estudar o código
- ✅ Pode criar sua própria versão
- ⚠️ Se distribuir modificações, deve disponibilizar o código fonte
- ⚠️ Se oferecer como serviço online, deve liberar o código modificado

Veja [LICENSE](LICENSE) para detalhes completos.

---

## 🎯 Roadmap

### Versão 1.1

- [ ] Sincronização com nuvem
- [ ] Widgets para home screen
- [ ] Suporte a múltiplas moedas
- [ ] Modo offline avançado

### Versão 1.2

- [ ] Integração com bancos
- [ ] IA para categorização automática
- [ ] Orçamentos mensais
- [ ] Metas financeiras

### Versão 2.0

- [ ] Versão web completa
- [ ] API REST
- [ ] Multi-usuário
- [ ] Relatórios avançados

## 🏆 Reconhecimentos

- **Expo Team** - Plataforma incrível
- **React Native Community** - Comunidade ativa
- **React Native Paper** - Componentes excelentes
- **Todos os contribuidores** - Suporte contínuo

---

**Desenvolvido com ❤️ para ajudar você a controlar suas finanças de forma inteligente!**

_"O controle financeiro é o primeiro passo para a liberdade."_

![Alt](https://repobeats.axiom.co/api/embed/e29fb48befb7e6f90f97484013bb79e1e7d04808.svg "Repobeats analytics image")
