# 📱 Controle Financeiro

Um aplicativo completo para controle de despesas pessoais desenvolvido com React Native e Expo. O app oferece funcionalidades avançadas para gerenciar despesas recorrentes, parcelas e financiamentos com reajustes automáticos.

## ✨ Funcionalidades Principais

### 💰 Gestão de Despesas
- **Adicionar despesas** com título, valor, data e categoria
- **Categorização** automática (Alimentação, Transporte, Moradia, etc.)
- **Descrições opcionais** para detalhes adicionais
- **Interface intuitiva** com design moderno

### 🔄 Despesas Recorrentes
- **Recorrência configurável**: Mensal, Semanal ou Anual
- **Sistema de parcelas** com controle de parcela atual
- **Lembretes automáticos** para despesas recorrentes
- **Visualização clara** de despesas recorrentes

### 🏦 Financiamentos com Reajustes
- **Cálculo automático** de juros compostos
- **Reajustes mensais** configuráveis (ex: redução de 0.5% ao mês)
- **Prestações calculadas** automaticamente
- **Valor ajustado** baseado no tempo decorrido
- **Suporte a financiamentos** como Caixa Econômica Federal

### 📊 Relatórios e Análises
- **Dashboard principal** com resumo financeiro
- **Gráficos interativos** de despesas por mês
- **Gráfico de pizza** por categoria
- **Top categorias** com percentuais
- **Análise de despesas** recorrentes e financiamentos

### 🔍 Filtros e Busca
- **Busca por texto** em títulos, descrições e categorias
- **Filtros por categoria** com chips interativos
- **Ordenação** por data, valor ou título
- **Lista organizada** com informações detalhadas

### ⚙️ Configurações Avançadas
- **Exportação de dados** para backup
- **Configurações de notificações**
- **Modo escuro** (em desenvolvimento)
- **Backup automático** dos dados
- **Gerenciamento de categorias** personalizadas

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js (versão 16 ou superior)
- npm ou yarn
- Expo CLI
- Android Studio (para Android) ou Xcode (para iOS)

### Passos de Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/controle-financeiro.git
cd controle-financeiro
```

2. **Instale as dependências**
```bash
npm install
# ou
yarn install
```

3. **Inicie o servidor de desenvolvimento**
```bash
npm start
# ou
yarn start
```

4. **Execute no dispositivo/emulador**
```bash
# Para Android
npm run android

# Para iOS
npm run ios

# Para web
npm run web
```

## 📱 Gerando APK para Android

### Método Rápido (Recomendado)
```bash
# Windows
build-apk.bat

# Linux/Mac
chmod +x build-apk.sh
./build-apk.sh
```

### Método Manual
```bash
# 1. Instalar EAS CLI
npm install -g eas-cli

# 2. Fazer login no Expo
eas login

# 3. Gerar APK
eas build --platform android --profile preview
```

### Instalar no Celular
1. **Baixe o APK** do link fornecido pelo Expo
2. **Ative "Fontes desconhecidas"** nas configurações do Android
3. **Instale o APK** tocando no arquivo

**📖 Consulte `docs/GERAR_APK.md` para instruções detalhadas**

## 📱 Como Usar

### Adicionando uma Despesa

1. **Toque no botão "+"** na tela inicial
2. **Preencha as informações básicas**:
   - Título da despesa
   - Valor (formato brasileiro)
   - Data
   - Categoria
   - Descrição (opcional)

### Configurando Despesas Recorrentes

1. **Ative o switch "Despesa Recorrente"**
2. **Escolha o tipo**: Mensal, Semanal ou Anual
3. **Defina o número de parcelas**
4. **Configure a parcela atual**

### Configurando Financiamentos

1. **Ative o switch "Financiamento"**
2. **Informe a taxa de juros mensal** (ex: 1.5 para 1.5%)
3. **Configure o reajuste mensal** (ex: 0.5 para redução de 0.5% ao mês)
4. **Veja os cálculos automáticos**:
   - Total com juros
   - Prestação mensal
   - Valor ajustado

### Visualizando Relatórios

1. **Acesse a aba "Relatórios"**
2. **Veja o resumo geral** com totais
3. **Analise os gráficos** de despesas por mês
4. **Verifique a distribuição** por categoria
5. **Monitore despesas** recorrentes e financiamentos

## 🛠️ Tecnologias Utilizadas

- **React Native** - Framework principal
- **Expo** - Plataforma de desenvolvimento
- **TypeScript** - Tipagem estática
- **React Navigation** - Navegação entre telas
- **React Native Paper** - Componentes de UI
- **Expo SQLite** - Banco de dados local
- **React Native Chart Kit** - Gráficos e visualizações
- **Expo Linear Gradient** - Gradientes visuais
- **Expo Vector Icons** - Ícones

## 📁 Estrutura do Projeto

```
controle-financeiro/
├── src/
│   ├── context/
│   │   └── FinanceContext.tsx    # Contexto global de finanças
│   └── screens/
│       ├── HomeScreen.tsx        # Tela principal
│       ├── AddExpenseScreen.tsx  # Adicionar despesa
│       ├── ExpensesScreen.tsx    # Lista de despesas
│       ├── ReportsScreen.tsx     # Relatórios
│       └── SettingsScreen.tsx    # Configurações
├── App.tsx                       # Componente principal
├── package.json                  # Dependências
└── README.md                     # Documentação
```

## 🎯 Funcionalidades Específicas

### Cálculo de Financiamentos

O app calcula automaticamente:

- **Juros compostos**: `Valor Final = Principal × (1 + Taxa)^Períodos`
- **Prestação mensal**: Fórmula padrão de financiamento
- **Reajustes**: `Valor Ajustado = Valor Original × (1 - Reajuste)^Meses`

### Exemplo de Financiamento Caixa

Para um financiamento de R$ 100.000 com:
- Taxa de juros: 1% ao mês
- Prazo: 360 meses
- Reajuste mensal: 0.5%

O app calculará:
- Total com juros: R$ 3.594.964,00
- Prestação inicial: R$ 1.028,61
- Valor após 12 meses: R$ 94.118,00

## 🔧 Configurações Avançadas

### Banco de Dados

O app usa SQLite local para armazenar:
- Despesas com todos os detalhes
- Configurações do usuário
- Histórico de transações

### Backup e Exportação

- **Exportação JSON**: Todos os dados em formato legível
- **Backup automático**: Configurável nas configurações
- **Restauração**: Funcionalidade em desenvolvimento

## 🐛 Solução de Problemas

### Erro de Dependências
```bash
# Limpe o cache do npm
npm cache clean --force

# Remova node_modules e reinstale
rm -rf node_modules
npm install
```

### Erro no Expo
```bash
# Limpe o cache do Expo
expo r -c

# Reinstale as dependências
npm install
```

### Problemas no Android
```bash
# Limpe o cache do Gradle
cd android && ./gradlew clean
```

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para suporte e dúvidas:
- Abra uma issue no GitHub
- Entre em contato via email
- Consulte a documentação do Expo

## 🎉 Agradecimentos

- Comunidade React Native
- Expo Team
- React Native Paper
- Todos os contribuidores

---

**Desenvolvido com ❤️ para ajudar no controle financeiro pessoal** 