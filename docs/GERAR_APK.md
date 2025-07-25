# 📱 GERAR APK - Guia Rápido

> **Nota:** Para setup completo, veja [BUILD_GUIDE.md](./BUILD_GUIDE.md)

Este é um guia simplificado para gerar APK rapidamente.

## ⚡ **MÉTODO RÁPIDO**

### 1. Pré-requisitos Mínimos
- Node.js 18+ instalado
- Conta Expo (gratuita)

### 2. Comando Único
```bash
# Instalar e buildar em uma linha
npx create-expo-app --template && cd app-despesas && npx eas build -p android --profile preview
```

### 3. Ou Passo a Passo
```bash
# 1. Instalar EAS CLI
npm install -g eas-cli

# 2. Login
eas login

# 3. Build
eas build -p android --profile preview
```

## 🔄 **MÉTODOS ALTERNATIVOS**

### Método 1: Script Automático
```bash
# Execute o script incluso
./gerar-apk.bat  # Windows
./gerar-apk.sh   # Linux/Mac
```

### Método 2: Expo CLI Legado
```bash
npx @expo/cli build:android
```

### Método 3: Build Manual
> ⚠️ **Avançado:** Requer Android Studio

```bash
expo eject
cd android && ./gradlew assembleRelease
```

## ⚙️ **CONFIGURAÇÃO (se necessário)**

### Arquivo eas.json (já incluído)
```json
{
  "build": {
    "preview": {
      "android": { "buildType": "apk" }
    }
  }
}
```

### app.json (já configurado)
- Nome: MySys App Despesas
- Package: com.appdespesas.app
- Permissões: Configuradas automaticamente

## 📱 **INSTALAR NO CELULAR**

### 🔧 Configurar Android (uma vez só)
1. **Configurações** → **Segurança** → **Fontes Desconhecidas** ✅
2. Ou **Configurações** → **Apps** → **Instalar apps desconhecidos** ✅

### 📥 Instalar APK
**Método 1: Transfer direto**
- Conecte USB → Copie APK → Toque no arquivo

**Método 2: WhatsApp/Email**
- Envie APK → Baixe → Instale

**Método 3: Google Drive**
- Upload APK → Compartilhe link → Baixe

### ✅ **Teste Rápido**
1. 📱 Instale **Expo Go** no celular
2. 💻 Execute `npm start` no computador  
3. 📷 Escaneie o QR code
4. ✅ Se funcionar, o APK vai funcionar também!

## ⚠️ **PROBLEMAS COMUNS**

> **Dica:** Para soluções detalhadas, veja [SOLUCAO_PROBLEMAS.md](./SOLUCAO_PROBLEMAS.md)

### ❌ "npm não reconhecido"
```bash
# Instale Node.js: https://nodejs.org/
node --version  # Testar
```

### ❌ "eas não reconhecido"
```bash
npm install -g eas-cli
```

### ❌ Build falha
```bash
# Limpar cache
npm start -- --reset-cache
```

### ❌ APK não instala
1. Ativar "Fontes Desconhecidas" no Android
2. Desinstalar versão anterior
3. Verificar se download terminou

## 📋 **COMANDOS Úteis**

```bash
# Ver status dos builds
eas build:list

# Baixar APK pronto
eas build:download

# Ver logs detalhados
eas build:view
```

## ⚡ **DICAS RÁPIDAS**

- ⏱️ **Primeiro build:** 10-15 minutos
- 🚀 **Builds seguintes:** Mais rápidos
- 📶 **Internet:** Conexão estável obrigatória
- 🆓 **Conta Expo:** Gratuita

## 📞 **PRECISA DE AJUDA?**

1. 📝 [SOLUCAO_PROBLEMAS.md](./SOLUCAO_PROBLEMAS.md)
2. 📚 [BUILD_GUIDE.md](./BUILD_GUIDE.md) (completo)
3. 🐛 [GitHub Issues](https://github.com/eduardoks98/app-despesas/issues)

---

**🚀 Boa sorte com o build!** 