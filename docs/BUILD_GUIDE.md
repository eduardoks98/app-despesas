# 🔨 Guia de Compilação - App Despesas

## Por Que Compilar?

- 💰 **100% Gratuito**: Sem custo algum
- 🔐 **Máxima Privacidade**: Compile e instale sem intermediários
- 🛠️ **Personalização**: Modifique como quiser
- 📚 **Aprendizado**: Entenda como o app funciona

## Pré-requisitos

### ⚡ Requisitos Básicos
- **Node.js 18+** - [Download](https://nodejs.org/)
- **4GB RAM mínimo**
- **10GB espaço em disco**
- **Conexão com internet estável**

### 🖥️ Para Windows
- **Git** (opcional) - [Download](https://git-scm.com/)
- **Visual Studio Code** (recomendado) - [Download](https://code.visualstudio.com/)

### 🤖 Para Android
- **Android Studio** - [Download](https://developer.android.com/studio)
- **Java JDK 17** (incluído no Android Studio)

### 🍎 Para iOS
- **macOS** (obrigatório)
- **Xcode 14+**
- **Conta Apple Developer** (para dispositivo físico)

## Passo a Passo

### 1. Clone o Repositório
```bash
git clone https://github.com/eduardoks98/app-despesas.git
cd app-despesas
```

### 2. Instale as Dependências
```bash
npm install
```

### 3. Configure o Ambiente

#### Android
```bash
# Aceite as licenças do Android
cd android
./gradlew
```

#### iOS
```bash
cd ios
pod install
```

### 4. Compile o App

#### 🚀 Método 1: EAS Build (Recomendado)
```bash
# Instale o EAS CLI
npm install -g eas-cli

# Login na conta Expo (gratuita)
eas login

# Configure o EAS (primeira vez)
eas build:configure

# Build para Android (gera APK)
eas build -p android --profile preview
```

#### ⚡ Método 2: Teste Rápido (Expo Go)
```bash
# Para testar sem compilar
npm start

# Instale "Expo Go" no celular
# Escaneie o QR code
```

#### 🔧 Método 3: Build Manual (Avançado)
```bash
# Requer Android Studio configurado
expo eject
cd android
./gradlew assembleRelease

# APK em: android/app/build/outputs/apk/release/
```

### 5. Instale no Seu Dispositivo

#### Android
1. Ative "Fontes Desconhecidas" nas configurações do Android
2. Transfira o APK para o dispositivo
3. Toque no arquivo APK para instalar

#### iOS
1. Use o Xcode para instalar em dispositivo de desenvolvimento
2. Ou use TestFlight para distribuição

## 🚨 Problemas Comuns

> **📋 Para soluções detalhadas:** [SOLUCAO_PROBLEMAS.md](./SOLUCAO_PROBLEMAS.md)

### ❌ "node não reconhecido" (Windows)
```bash
# Reinstale Node.js: https://nodejs.org/
# Reinicie o terminal
node --version  # Verificar
```

### ❌ "eas não reconhecido"
```bash
npm install -g eas-cli
```

### ❌ "Metro bundler error"
```bash
# Limpe o cache
npm start -- --reset-cache
```

### ❌ Build falha
```bash
# Limpar dependências
rm -rf node_modules
npm install
```

### ❌ APK não instala
1. **Ativar "Fontes Desconhecidas"** no Android
2. **Desinstalar versão anterior** se existir
3. **Verificar se download completou**

## 💡 Dicas de Performance

1. **Use um dispositivo físico** para melhor performance
2. **Compile em modo release** para app otimizado:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
3. **Teste bem** antes de usar como app principal
4. **Faça backup** dos seus dados regularmente

## 🛠️ Personalização

### Alterando o Nome do App
```javascript
// app.json
{
  "expo": {
    "name": "Seu Nome Aqui",
    "slug": "seu-slug"
  }
}
```

### Alterando Cores
```typescript
// src/styles/colors.ts
export const colors = {
  primary: '#SUA_COR_AQUI',
  // ...
};
```

### Alterando Ícone
1. Substitua `assets/icon.png`
2. Execute: `npx expo install`

## 📊 Perfis de Build

O projeto inclui 3 perfis configurados:

### Development
```bash
eas build -p android --profile development
```
- Para desenvolvimento e debug
- Inclui debugging tools

### Preview  
```bash
eas build -p android --profile preview
```
- Para testes internos
- Gera APK otimizado

### Production
```bash
eas build -p android --profile production
```
- Para produção nas lojas
- Gera AAB otimizado

## 🧪 Testando Sua Build

### Testes Essenciais
- [ ] App abre sem crashes
- [ ] Todas as telas funcionam
- [ ] Adicionar/editar despesas
- [ ] Gerar relatórios
- [ ] Notificações funcionam
- [ ] Backup/restore

### Testes de Performance
```bash
# Execute os testes automatizados
npm test

# Verificar tipagem
npm run type-check

# Lint do código
npm run lint
```

## 🤝 Precisa de Ajuda?

- 📖 [FAQ](../docs/FAQ.md)
- 💬 [Discussões GitHub](https://github.com/eduardoks98/app-despesas/discussions)
- 🐛 [Reportar Bug](https://github.com/eduardoks98/app-despesas/issues)
- 📧 **Email**: eduardoks1998@gmail.com

## ⚖️ Lembretes Legais

- ✅ Use para fins pessoais
- ✅ Modifique como quiser
- ⚠️ Se distribuir modificações, disponibilize código fonte (AGPL-3.0)
- ❌ Não use o nome "App Despesas" em versões modificadas

---

**Prefere simplicidade?** 
Aguarde o lançamento da versão oficial nas lojas! Em breve disponível.

**Gostou do projeto?** ⭐ Deixe uma estrela no GitHub!