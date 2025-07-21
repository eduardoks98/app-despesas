# 🪟 Instalação no Windows

Este guia detalha como instalar e configurar o aplicativo Controle Financeiro no Windows.

## 📋 Pré-requisitos

### 1. Node.js
- **Versão**: 16.x ou superior
- **Download**: [nodejs.org](https://nodejs.org/)
- **Instalação**: Execute o instalador e siga as instruções

### 2. Git (Opcional)
- **Download**: [git-scm.com](https://git-scm.com/)
- **Instalação**: Execute o instalador com configurações padrão

### 3. Android Studio (Para Android)
- **Download**: [developer.android.com](https://developer.android.com/studio)
- **Instalação**: 
  1. Execute o instalador
  2. Escolha "Custom" setup
  3. Marque "Android SDK" e "Android Virtual Device"
  4. Configure o Android SDK

### 4. Visual Studio Code (Recomendado)
- **Download**: [code.visualstudio.com](https://code.visualstudio.com/)
- **Extensões recomendadas**:
  - React Native Tools
  - TypeScript and JavaScript Language Features
  - Prettier - Code formatter

## 🚀 Instalação Rápida

### Opção 1: Script Automático
```cmd
# Execute o script de setup
setup.bat
```

### Opção 2: Instalação Manual
```cmd
# 1. Clone o repositório (se usando Git)
git clone https://github.com/seu-usuario/controle-financeiro.git
cd controle-financeiro

# 2. Instale as dependências
npm install

# 3. Instale o Expo CLI globalmente
npm install -g @expo/cli

# 4. Inicie o aplicativo
npm start
```

## 📱 Configuração do Android

### 1. Configurar Variáveis de Ambiente
```cmd
# Adicione ao PATH do Windows:
# C:\Users\[SEU_USUARIO]\AppData\Local\Android\Sdk\platform-tools
# C:\Users\[SEU_USUARIO]\AppData\Local\Android\Sdk\tools
```

### 2. Criar Emulador Android
1. Abra o Android Studio
2. Vá em "Tools" > "AVD Manager"
3. Clique em "Create Virtual Device"
4. Escolha um dispositivo (ex: Pixel 4)
5. Escolha uma imagem do sistema (ex: API 30)
6. Clique em "Finish"

### 3. Executar no Android
```cmd
# Com o emulador aberto
npm run android

# Ou escaneie o QR code com o app Expo Go
```

## 🍎 Configuração do iOS (Opcional)

### Requisitos
- macOS com Xcode instalado
- Ou usar Expo Go no iPhone

### Usando Expo Go
1. Instale o app "Expo Go" na App Store
2. Escaneie o QR code que aparece no terminal
3. O app será carregado automaticamente

## 🔧 Solução de Problemas

### Erro: "node não é reconhecido"
```cmd
# Verifique se o Node.js está instalado
node --version

# Se não estiver, reinstale o Node.js
```

### Erro: "npm não é reconhecido"
```cmd
# Verifique se o npm está instalado
npm --version

# Reinstale o Node.js (inclui npm)
```

### Erro: "expo não é reconhecido"
```cmd
# Instale o Expo CLI globalmente
npm install -g @expo/cli

# Verifique a instalação
expo --version
```

### Erro: "adb não é reconhecido"
```cmd
# Adicione o Android SDK ao PATH
# C:\Users\[SEU_USUARIO]\AppData\Local\Android\Sdk\platform-tools

# Ou use o caminho completo
C:\Users\[SEU_USUARIO]\AppData\Local\Android\Sdk\platform-tools\adb.exe
```

### Erro: "Metro bundler"
```cmd
# Limpe o cache
npm start -- --reset-cache

# Ou
expo r -c
```

### Erro: "Porta 8081 em uso"
```cmd
# Encontre o processo usando a porta
netstat -ano | findstr :8081

# Mate o processo
taskkill /PID [PID_NUMBER] /F
```

## 📦 Comandos Úteis

### Desenvolvimento
```cmd
# Iniciar servidor de desenvolvimento
npm start

# Executar no Android
npm run android

# Executar no iOS (requer macOS)
npm run ios

# Executar na web
npm run web
```

### Manutenção
```cmd
# Limpar cache do npm
npm cache clean --force

# Reinstalar dependências
rmdir /s node_modules
npm install

# Atualizar Expo CLI
npm install -g @expo/cli@latest
```

### Build
```cmd
# Build para Android
expo build:android

# Build para iOS
expo build:ios

# Build para web
expo build:web
```

## 🛠️ Configurações Avançadas

### 1. Configurar Proxy (se necessário)
```cmd
# Configurar proxy para npm
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Configurar proxy para Git
git config --global http.proxy http://proxy.company.com:8080
git config --global https.proxy http://proxy.company.com:8080
```

### 2. Configurar Firewall
- Adicione exceções para Node.js
- Libere a porta 8081
- Configure o antivírus para não bloquear o Metro bundler

### 3. Configurar VS Code
```json
// settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

## 📚 Recursos Adicionais

### Documentação Oficial
- [React Native](https://reactnative.dev/docs/environment-setup)
- [Expo](https://docs.expo.dev/)
- [Android Studio](https://developer.android.com/studio/intro)

### Comunidade
- [React Native Brasil](https://reactnatives.com.br/)
- [Expo Discord](https://discord.gg/expo)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/react-native)

### Ferramentas Úteis
- [Flipper](https://fbflipper.com/) - Debug para React Native
- [Reactotron](https://github.com/infinitered/reactotron) - Debug avançado
- [Postman](https://www.postman.com/) - Teste de APIs

## 🆘 Suporte

Se encontrar problemas:

1. **Verifique os logs** no terminal
2. **Consulte a documentação** oficial
3. **Pesquise no Google** com a mensagem de erro
4. **Abra uma issue** no GitHub do projeto
5. **Entre em contato** com a comunidade

---

**Boa sorte com o desenvolvimento! 🚀** 