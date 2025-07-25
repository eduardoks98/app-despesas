# Ícones do App Despesas

## 🎨 Design do Ícone

O ícone do App Despesas representa uma carteira digital com cartões de crédito e um símbolo de dinheiro, utilizando uma paleta de cores roxa que transmite confiança e sofisticação financeira.

### Elementos Visuais
- **Fundo**: Gradiente roxo (#8B5CF6 → #7C3AED → #6D28D9)
- **Carteira**: Branca com transparência, simulando couro/material premium
- **Cartões**: Empilhados em roxo (#8B5CF6) para criar profundidade
- **Símbolo $**: Verde (#10B981) em círculo, representando dinheiro/lucro
- **Formato**: Bordas arredondadas (15% radius) seguindo padrões modernos

## 📁 Estrutura de Arquivos

```
assets/icons/
├── app-icon.svg              # Ícone vetorial principal
├── icon-generator.html       # Gerador visual de ícones
├── web/                      # Ícones para web
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── icon-192x192.png
│   └── icon-512x512.png
├── mobile/                   # Ícones para mobile
│   ├── icon-1024.png        # App Store
│   ├── icon-512.png         # Google Play
│   └── icon-180.png         # iOS home screen
└── android/                  # Ícones específicos Android
    ├── ic_launcher_mdpi.png (48x48)
    ├── ic_launcher_hdpi.png (72x72)
    ├── ic_launcher_xhdpi.png (96x96)
    ├── ic_launcher_xxhdpi.png (144x144)
    └── ic_launcher_xxxhdpi.png (192x192)
```

## 🛠️ Como Gerar os Ícones

### Método 1: Gerador HTML
1. Abra `icon-generator.html` no navegador
2. Clique com botão direito em cada ícone
3. Salve como PNG na pasta correspondente

### Método 2: Script Python (requer Inkscape)
```bash
cd scripts
python generate-icons.py
```

### Método 3: Ferramentas Online
- [Favicon.io](https://favicon.io/) - Para favicons
- [App Icon Generator](https://appicon.co/) - Para ícones mobile
- [PWA Asset Generator](https://www.pwabuilder.com/) - Para PWA

## 📱 Configuração nos Apps

### Expo (React Native)
Arquivo: `apps/mobile/app.json`
```json
{
  "expo": {
    "icon": "../../assets/icons/app-icon.png",
    "splash": {
      "backgroundColor": "#8B5CF6"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "../../assets/icons/app-icon.png",
        "backgroundColor": "#8B5CF6"
      }
    },
    "web": {
      "favicon": "../../assets/icons/web/favicon.png"
    }
  }
}
```

### Web App
Arquivo: `apps/web/public/index.html`
```html
<link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/web/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/icons/web/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/icons/web/icon-180x180.png">
<link rel="manifest" href="/manifest.json">
```

## 🎯 Especificações Técnicas

### Cores Principais
- **Roxo Principal**: #8B5CF6 (RGB: 139, 92, 246)
- **Roxo Médio**: #7C3AED (RGB: 124, 58, 237)  
- **Roxo Escuro**: #6D28D9 (RGB: 109, 40, 217)
- **Verde Dinheiro**: #10B981 (RGB: 16, 185, 129)
- **Branco**: #FFFFFF com transparências variadas

### Tamanhos Requeridos

#### iOS
- 20px, 29px, 40px, 58px, 60px, 80px, 87px, 120px, 180px, 1024px

#### Android
- 36px (LDPI), 48px (MDPI), 72px (HDPI), 96px (XHDPI), 144px (XXHDPI), 192px (XXXHDPI)

#### Web
- 16px, 32px, 96px, 192px, 512px

## 🔄 Atualizações Futuras

### Versão 2.0 (Planejado)
- [ ] Ícone adaptável para modo escuro
- [ ] Variações sazonais (opcional)
- [ ] Ícone de notificação simplificado
- [ ] Versão monocromática para widgets

### Melhorias de Design
- [ ] Animação micro-interativa no ícone (para splash screen)
- [ ] Versão em gradiente dourado para tier premium
- [ ] Ícones de categoria baseados no design principal

## 📏 Guidelines de Uso

### ✅ Permitido
- Usar o ícone em materiais oficiais do app
- Redimensionar mantendo proporções
- Aplicar sobre fundos que mantenham contraste

### ❌ Não Permitido
- Alterar cores ou proporções
- Adicionar elementos externos
- Usar sem o fundo gradiente original
- Distorcer ou inclinar o ícone

---

**Criado em**: 2025-01-25  
**Designer**: Claude AI  
**Aprovado por**: Eduardo  
**Versão**: 1.0