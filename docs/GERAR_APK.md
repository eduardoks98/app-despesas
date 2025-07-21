# 📱 Como Gerar o APK para Android

Este guia mostra como gerar o arquivo APK para instalar o aplicativo no seu celular Android.

## 🚀 **Opção 1: Build Local (Recomendado)**

### Pré-requisitos
- Node.js instalado
- Expo CLI instalado
- Android Studio (opcional, para emulador)

### Passo 1: Instalar EAS CLI
```bash
# Instalar EAS CLI globalmente
npm install -g eas-cli

# Verificar instalação
eas --version
```

### Passo 2: Fazer Login no Expo
```bash
# Fazer login na sua conta Expo
eas login

# Se não tiver conta, crie em: https://expo.dev/signup
```

### Passo 3: Configurar Build
```bash
# Inicializar configuração EAS
eas build:configure
```

### Passo 4: Gerar APK
```bash
# Gerar APK para Android
eas build --platform android --profile preview

# Ou para versão de desenvolvimento
eas build --platform android --profile development
```

## 🏗️ **Opção 2: Build na Nuvem (Mais Fácil)**

### Passo 1: Criar conta Expo
1. Acesse: https://expo.dev/signup
2. Crie uma conta gratuita

### Passo 2: Fazer Login
```bash
npx expo login
```

### Passo 3: Gerar Build
```bash
# Build na nuvem (gratuito)
npx expo build:android

# Ou usando EAS
eas build --platform android
```

## 📦 **Opção 3: Build Manual (Avançado)**

### Passo 1: Ejetar do Expo
```bash
# Ejetar do Expo para React Native puro
expo eject
```

### Passo 2: Configurar Android
```bash
# Navegar para pasta Android
cd android

# Limpar build
./gradlew clean

# Gerar APK
./gradlew assembleRelease
```

### Passo 3: Encontrar o APK
O APK estará em: `android/app/build/outputs/apk/release/app-release.apk`

## 🔧 **Configurações Avançadas**

### Arquivo eas.json
Crie um arquivo `eas.json` na raiz do projeto:

```json
{
  "cli": {
    "version": ">= 3.13.3"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Configurar app.json
Certifique-se que o `app.json` tenha as configurações corretas:

```json
{
  "expo": {
    "name": "Controle Financeiro",
    "slug": "controle-financeiro",
    "version": "1.0.0",
    "android": {
      "package": "com.controlefinanceiro.app",
      "versionCode": 1,
      "permissions": [
        "WRITE_EXTERNAL_STORAGE",
        "READ_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

## 📱 **Instalar no Celular**

### Método 1: Transferir APK
1. **Conecte o celular** via USB
2. **Ative a depuração USB** nas configurações do Android
3. **Transfira o APK** para o celular
4. **Instale o APK** tocando no arquivo

### Método 2: Email/WhatsApp
1. **Envie o APK** por email ou WhatsApp
2. **Baixe no celular** e instale

### Método 3: Google Drive
1. **Faça upload** do APK no Google Drive
2. **Compartilhe o link** e baixe no celular

## ⚙️ **Configurações do Android**

### Ativar Instalação de Fontes Desconhecidas
1. Vá em **Configurações** > **Segurança**
2. Ative **Fontes desconhecidas**
3. Ou vá em **Configurações** > **Apps** > **Instalar apps desconhecidos**

### Ativar Depuração USB
1. Vá em **Configurações** > **Sobre o telefone**
2. Toque 7 vezes em **Número da versão**
3. Volte e vá em **Opções do desenvolvedor**
4. Ative **Depuração USB**

## 🐛 **Solução de Problemas**

### Erro: "npm não é reconhecido"
```bash
# Instalar Node.js primeiro
# Download: https://nodejs.org/
```

### Erro: "expo não é reconhecido"
```bash
# Instalar Expo CLI
npm install -g @expo/cli
```

### Erro: "eas não é reconhecido"
```bash
# Instalar EAS CLI
npm install -g eas-cli
```

### Erro de Build
```bash
# Limpar cache
expo r -c

# Reinstalar dependências
rm -rf node_modules
npm install
```

### APK não instala
1. **Verifique as permissões** de instalação
2. **Desinstale versões anteriores** do app
3. **Verifique se o APK está completo**

## 📋 **Comandos Úteis**

### Verificar Status
```bash
# Status do build
eas build:list

# Logs do build
eas build:view
```

### Build Específico
```bash
# Build de desenvolvimento
eas build --platform android --profile development

# Build de preview
eas build --platform android --profile preview

# Build de produção
eas build --platform android --profile production
```

### Download do APK
```bash
# Baixar APK do build
eas build:download
```

## 🎯 **Dicas Importantes**

1. **Primeiro build** pode demorar 10-15 minutos
2. **Builds subsequentes** são mais rápidos
3. **Mantenha o terminal aberto** durante o build
4. **Verifique a conexão** com a internet
5. **Use conta Expo gratuita** para builds na nuvem

## 📞 **Suporte**

Se encontrar problemas:
1. **Verifique os logs** no terminal
2. **Consulte a documentação** do Expo
3. **Pesquise no Google** com a mensagem de erro
4. **Abra uma issue** no GitHub

---

**Boa sorte com o build! 🚀** 