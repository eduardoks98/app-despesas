# 📱 App Despesas - Controle Financeiro Inteligente

Um aplicativo completo de controle financeiro desenvolvido com React Native e Expo, oferecendo gestão avançada de despesas, receitas, parcelamentos e assinaturas com recursos profissionais.

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

## 🛠️ Tecnologias Utilizadas

### Core

- **React Native** - Framework mobile
- **Expo** - Plataforma de desenvolvimento
- **TypeScript** - Tipagem estática
- **React Navigation** - Navegação entre telas

### UI/UX

- **React Native Paper** - Componentes Material Design
- **React Native Chart Kit** - Gráficos e visualizações
- **Expo Linear Gradient** - Gradientes visuais
- **Expo Vector Icons** - Ícones

### Dados e Armazenamento

- **SQLite** - Banco de dados local
- **AsyncStorage** - Armazenamento persistente
- **Expo File System** - Manipulação de arquivos

### Funcionalidades Avançadas

- **Expo Notifications** - Sistema de notificações
- **Expo Sharing** - Compartilhamento de arquivos
- **Expo Print** - Geração de relatórios PDF
- **Expo Haptics** - Feedback tátil

## 📱 Compatibilidade

- **Android**: 6.0+ (API 23+)
- **iOS**: 12.0+
- **Expo SDK**: 53
- **React Native**: 0.79.5

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Expo CLI
- Android Studio (para desenvolvimento Android)
- Xcode (para desenvolvimento iOS - macOS)

### Passos de Instalação

1. **Clone o repositório**

```bash
git clone https://github.com/seu-usuario/app-despesas.git
cd app-despesas
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure as variáveis de ambiente**

```bash
cp env.example .env
# Edite o arquivo .env com suas configurações
```

4. **Execute o projeto**

```bash
npm start
```

5. **Execute no dispositivo/emulador**

```bash
# Para Android
npm run android

# Para iOS
npm run ios

# Para web
npm run web
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

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- 📧 **Email**: suporte@appdespesas.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/seu-usuario/app-despesas/issues)
- 📖 **Documentação**: [Wiki](https://github.com/seu-usuario/app-despesas/wiki)
- 💬 **Discord**: [Comunidade](https://discord.gg/appdespesas)

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
