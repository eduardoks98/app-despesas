# 🔧 Solução de Problemas - Build APK

Este guia ajuda a resolver problemas comuns ao gerar o APK.

## ❌ **Problema: "npm não é reconhecido"**

### Solução:
1. **Instale o Node.js**:
   - Download: https://nodejs.org/
   - Escolha a versão LTS (recomendada)
   - Execute o instalador

2. **Reinicie o terminal** após a instalação

3. **Verifique a instalação**:
   ```cmd
   node --version
   npm --version
   ```

## ❌ **Problema: "EAS CLI não encontrado"**

### Solução 1: Instalar EAS CLI
```cmd
npm install -g eas-cli
```

### Solução 2: Usar método alternativo
```cmd
# Execute o script simples
build-simple.bat
```

### Solução 3: Usar Expo CLI diretamente
```cmd
npm install -g @expo/cli
expo build:android
```

## ❌ **Problema: "Erro 404 - @expo/eas-cli"**

### Solução:
O pacote mudou de nome. Use:
```cmd
npm install -g eas-cli
```

## ❌ **Problema: "Erro de build na nuvem"**

### Soluções:

1. **Verificar conexão com internet**
2. **Limpar cache**:
   ```cmd
   expo r -c
   ```

3. **Reinstalar dependências**:
   ```cmd
   rm -rf node_modules
   npm install
   ```

4. **Verificar app.json**:
   - Certifique-se que o `package` está configurado
   - Verifique se não há caracteres especiais

## ❌ **Problema: "APK não instala no celular"**

### Soluções:

1. **Ativar fontes desconhecidas**:
   - Configurações > Segurança > Fontes desconhecidas
   - Ou Configurações > Apps > Instalar apps desconhecidos

2. **Desinstalar versão anterior**:
   - Remova o app se já estiver instalado

3. **Verificar arquivo APK**:
   - Certifique-se que o download foi completo
   - Tente baixar novamente

## ❌ **Problema: "Erro de permissões"**

### Solução:
1. **Execute como administrador**:
   - Clique com botão direito no script
   - Escolha "Executar como administrador"

2. **Verificar permissões de pasta**:
   - Certifique-se que tem permissão de escrita na pasta

## ❌ **Problema: "Build demora muito"**

### Soluções:

1. **Primeiro build**: Normal demorar 10-15 minutos
2. **Builds subsequentes**: Devem ser mais rápidos
3. **Verificar conexão**: Internet estável é necessária
4. **Tentar em horário de menor tráfego**

## ❌ **Problema: "Erro de memória"**

### Soluções:

1. **Fechar outros programas**:
   - Feche navegadores, editores, etc.

2. **Limpar cache do npm**:
   ```cmd
   npm cache clean --force
   ```

3. **Reiniciar o computador**

## 🚀 **Métodos Alternativos**

### Método 1: Build Simples
```cmd
build-simple.bat
```

### Método 2: Expo CLI Direto
```cmd
npm install -g @expo/cli
expo build:android
```

### Método 3: Build Local
```cmd
expo eject
cd android
./gradlew assembleRelease
```

### Método 4: Usar Expo Go
1. **Instale Expo Go** no celular
2. **Execute** `npm start`
3. **Escaneie o QR code**

## 📱 **Teste Rápido**

Para testar se tudo está funcionando:

1. **Execute o app em desenvolvimento**:
   ```cmd
   npm start
   ```

2. **Instale Expo Go** no celular

3. **Escaneie o QR code**

4. **Se funcionar**, então o build deve funcionar também

## 🔍 **Verificar Logs**

### Logs do Build
```cmd
# Ver logs detalhados
expo build:android --clear-cache
```

### Logs do Metro
```cmd
# Ver logs do Metro bundler
npm start -- --reset-cache
```

### Logs do npm
```cmd
# Ver logs de instalação
npm install --verbose
```

## 📞 **Suporte Adicional**

### Recursos Úteis:
- [Documentação Expo](https://docs.expo.dev/)
- [Fórum Expo](https://forums.expo.dev/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)

### Comandos de Diagnóstico:
```cmd
# Verificar versões
node --version
npm --version
expo --version

# Verificar configuração
expo doctor

# Limpar tudo
expo r -c
npm cache clean --force
rm -rf node_modules
npm install
```

## 🎯 **Checklist de Solução**

- [ ] Node.js instalado e funcionando
- [ ] npm funcionando
- [ ] Expo CLI instalado
- [ ] Conexão com internet estável
- [ ] Conta Expo criada
- [ ] app.json configurado corretamente
- [ ] Sem erros de sintaxe no código
- [ ] Permissões de administrador (se necessário)

---

**Se ainda tiver problemas, tente o método simples primeiro!** 🚀 