#!/usr/bin/env node

/**
 * Script simples para criar ícone PNG usando Canvas
 * Como alternativa quando Python/Inkscape não estão disponíveis
 */

const fs = require('fs');
const path = require('path');

// Configuração
const ICON_SIZE = 512;
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'icons');

// Cores do tema
const COLORS = {
  primary: '#8B5CF6',
  secondary: '#7C3AED', 
  tertiary: '#6D28D9',
  white: '#FFFFFF',
  green: '#10B981'
};

function createSimpleIcon() {
  console.log('🎨 Criando ícone simples usando HTML Canvas...');
  
  // Criar HTML temporário para renderizar o ícone
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Icon Generator</title>
</head>
<body>
    <canvas id="canvas" width="${ICON_SIZE}" height="${ICON_SIZE}"></canvas>
    
    <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        // Criar gradiente de fundo
        const gradient = ctx.createLinearGradient(0, 0, ${ICON_SIZE}, ${ICON_SIZE});
        gradient.addColorStop(0, '${COLORS.primary}');
        gradient.addColorStop(0.5, '${COLORS.secondary}');
        gradient.addColorStop(1, '${COLORS.tertiary}');
        
        // Desenhar fundo com bordas arredondadas
        ctx.beginPath();
        ctx.roundRect(0, 0, ${ICON_SIZE}, ${ICON_SIZE}, 80);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Desenhar carteira (corpo principal)
        ctx.beginPath();
        ctx.roundRect(64, 90, 384, 240, 20);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fill();
        
        // Desenhar aba da carteira
        ctx.beginPath();
        ctx.roundRect(64, 70, 384, 60, 20);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
        
        // Desenhar cartões (3 cartões empilhados)
        const cardWidth = 160;
        const cardHeight = 90;
        const cardX = 176;
        
        // Cartão 3 (fundo)
        ctx.beginPath();
        ctx.roundRect(cardX - 16, 150, cardWidth, cardHeight, 8);
        ctx.fillStyle = 'rgba(139, 92, 246, 0.7)';
        ctx.fill();
        
        // Cartão 2 (meio)
        ctx.beginPath();
        ctx.roundRect(cardX - 8, 140, cardWidth, cardHeight, 8);
        ctx.fillStyle = 'rgba(139, 92, 246, 0.85)';
        ctx.fill();
        
        // Cartão 1 (frente)
        ctx.beginPath();
        ctx.roundRect(cardX, 130, cardWidth, cardHeight, 8);
        ctx.fillStyle = '${COLORS.primary}';
        ctx.fill();
        
        // Desenhar chip do cartão
        ctx.beginPath();
        ctx.roundRect(cardX + 100, 160, 20, 15, 3);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
        
        // Desenhar círculo do símbolo do dinheiro
        ctx.beginPath();
        ctx.arc(390, 280, 35, 0, 2 * Math.PI);
        ctx.fillStyle = '${COLORS.green}';
        ctx.fill();
        
        // Desenhar símbolo $
        ctx.font = 'bold 36px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 390, 280);
        
        // Converter para PNG e fazer download
        canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'app-icon.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.log('✅ Ícone gerado! Verifique o download.');
        }, 'image/png');
    </script>
</body>
</html>`;

  // Salvar HTML temporário
  const htmlPath = path.join(OUTPUT_DIR, 'temp-icon-generator.html');
  fs.writeFileSync(htmlPath, htmlContent);
  
  console.log(`📝 Arquivo HTML criado: ${htmlPath}`);
  console.log('🌐 Abra este arquivo no navegador para gerar o ícone PNG');
  console.log('💡 O arquivo será baixado automaticamente quando aberto');
  
  return htmlPath;
}

// Executar se for chamado diretamente
if (require.main === module) {
  try {
    createSimpleIcon();
  } catch (error) {
    console.error('❌ Erro ao criar ícone:', error.message);
    process.exit(1);
  }
}

module.exports = { createSimpleIcon };