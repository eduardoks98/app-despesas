#!/usr/bin/env python3
"""
Script para gerar ícones do app em diferentes resoluções
Converte o SVG para PNG nas resoluções necessárias para mobile e web
"""

import os
import subprocess
from pathlib import Path

# Diretórios
BASE_DIR = Path(__file__).parent.parent
ASSETS_DIR = BASE_DIR / "assets"
ICONS_DIR = ASSETS_DIR / "icons"
SOURCE_SVG = ICONS_DIR / "app-icon.svg"

# Resoluções necessárias
RESOLUTIONS = {
    # Mobile (iOS)
    "ios": [
        (20, "icon-20.png"),
        (29, "icon-29.png"),
        (40, "icon-40.png"),
        (58, "icon-58.png"),
        (60, "icon-60.png"),
        (80, "icon-80.png"),
        (87, "icon-87.png"),
        (120, "icon-120.png"),
        (180, "icon-180.png"),
        (1024, "icon-1024.png"),
    ],
    # Mobile (Android)
    "android": [
        (36, "ic_launcher_ldpi.png"),
        (48, "ic_launcher_mdpi.png"),
        (72, "ic_launcher_hdpi.png"),
        (96, "ic_launcher_xhdpi.png"),
        (144, "ic_launcher_xxhdpi.png"),
        (192, "ic_launcher_xxxhdpi.png"),
        (512, "ic_launcher_web.png"),
    ],
    # Web
    "web": [
        (16, "favicon-16x16.png"),
        (32, "favicon-32x32.png"),
        (96, "favicon-96x96.png"),
        (192, "icon-192x192.png"),
        (512, "icon-512x512.png"),
    ],
    # Geral
    "general": [
        (64, "icon-64.png"),
        (128, "icon-128.png"),
        (256, "icon-256.png"),
        (512, "icon-512.png"),
    ]
}

def check_dependencies():
    """Verifica se as dependências estão instaladas"""
    try:
        subprocess.run(["inkscape", "--version"], 
                      capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Inkscape não encontrado. Instale o Inkscape para continuar.")
        print("Download: https://inkscape.org/release/")
        return False

def create_directories():
    """Cria os diretórios necessários"""
    for platform in RESOLUTIONS.keys():
        platform_dir = ICONS_DIR / platform
        platform_dir.mkdir(parents=True, exist_ok=True)
        print(f"📁 Diretório criado: {platform_dir}")

def generate_png(size, output_path):
    """Gera um PNG a partir do SVG usando Inkscape"""
    try:
        cmd = [
            "inkscape",
            str(SOURCE_SVG),
            "--export-type=png",
            f"--export-width={size}",
            f"--export-height={size}",
            f"--export-filename={output_path}"
        ]
        
        subprocess.run(cmd, capture_output=True, check=True)
        print(f"✅ Gerado: {output_path} ({size}x{size})")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao gerar {output_path}: {e}")
        return False

def generate_all_icons():
    """Gera todos os ícones"""
    if not SOURCE_SVG.exists():
        print(f"❌ Arquivo SVG não encontrado: {SOURCE_SVG}")
        return False
    
    if not check_dependencies():
        return False
    
    create_directories()
    
    print(f"🎨 Gerando ícones a partir de: {SOURCE_SVG}")
    
    success_count = 0
    total_count = 0
    
    for platform, sizes in RESOLUTIONS.items():
        print(f"\n📱 Gerando ícones para: {platform}")
        
        for size, filename in sizes:
            output_path = ICONS_DIR / platform / filename
            total_count += 1
            
            if generate_png(size, output_path):
                success_count += 1
    
    print(f"\n🎉 Concluído! {success_count}/{total_count} ícones gerados com sucesso.")
    
    if success_count < total_count:
        print("⚠️  Alguns ícones falharam. Verifique se o Inkscape está instalado corretamente.")
    
    return success_count == total_count

def generate_favicon():
    """Gera favicon.ico para web"""
    try:
        # Gera favicon.ico usando ImageMagick (se disponível)
        favicon_sizes = [16, 32, 48]
        temp_files = []
        
        # Primeiro gera PNGs temporários
        for size in favicon_sizes:
            temp_file = ICONS_DIR / f"temp_{size}.png"
            if generate_png(size, temp_file):
                temp_files.append(str(temp_file))
        
        if temp_files:
            try:
                # Tenta criar favicon.ico
                favicon_path = ICONS_DIR / "web" / "favicon.ico"
                cmd = ["magick"] + temp_files + [str(favicon_path)]
                subprocess.run(cmd, capture_output=True, check=True)
                print(f"✅ Favicon gerado: {favicon_path}")
                
                # Remove arquivos temporários
                for temp_file in temp_files:
                    Path(temp_file).unlink()
                    
            except (subprocess.CalledProcessError, FileNotFoundError):
                print("⚠️  ImageMagick não encontrado. Favicon.ico não foi gerado.")
                print("   Você pode usar um serviço online para criar o favicon.ico")
    
    except Exception as e:
        print(f"❌ Erro ao gerar favicon: {e}")

if __name__ == "__main__":
    print("🚀 Iniciando geração de ícones...")
    
    if generate_all_icons():
        generate_favicon()
        print("\n✨ Todos os ícones foram gerados com sucesso!")
        print(f"📍 Ícones salvos em: {ICONS_DIR}")
    else:
        print("\n❌ Falha na geração de alguns ícones.")