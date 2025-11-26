#!/bin/bash

# Script para iniciar el frontend de Next.js de manera que el WebSocket funcione correctamente
# Este script inicia el servidor en primer plano para evitar problemas con WebSocket/HMR

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌐 Iniciando frontend Next.js...${NC}"
echo -e "${YELLOW}💡 Nota: Este script inicia el servidor en primer plano${NC}"
echo -e "${YELLOW}   Para detenerlo, presiona Ctrl+C${NC}"
echo ""

cd "$FRONTEND_DIR"

# Configurar variables de entorno para mejorar estabilidad
export WATCHPACK_POLLING=false
export NEXT_TELEMETRY_DISABLED=1

# Iniciar Next.js en primer plano
npm run dev

