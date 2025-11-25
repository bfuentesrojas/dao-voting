#!/bin/bash

# Script para preparar el proyecto para GitHub
# Uso: bash scripts/prepare-github.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Preparando proyecto para GitHub...${NC}"

# Verificar que estamos en el directorio raíz
if [ ! -f "README.md" ]; then
    echo -e "${RED}Error: Ejecuta este script desde la raíz del proyecto${NC}"
    exit 1
fi

# Verificar que .env.local no esté en git
if git ls-files --error-unmatch frontend/.env.local 2>/dev/null; then
    echo -e "${YELLOW}Advertencia: frontend/.env.local está siendo rastreado por git${NC}"
    echo -e "${YELLOW}Eliminándolo del índice...${NC}"
    git rm --cached frontend/.env.local 2>/dev/null || true
fi

# Verificar que no haya archivos sensibles
echo -e "${GREEN}Verificando archivos sensibles...${NC}"
if [ -f "frontend/.env.local" ]; then
    echo -e "${GREEN}✓ frontend/.env.local existe (correcto, está en .gitignore)${NC}"
fi

# Mostrar estado de git
echo -e "\n${GREEN}Estado de git:${NC}"
git status --short | head -20

echo -e "\n${GREEN}✓ Proyecto preparado para GitHub${NC}"
echo -e "\n${YELLOW}Próximos pasos:${NC}"
echo "1. Revisa los archivos con: git status"
echo "2. Haz commit: git commit -m 'Initial commit: DAO Voting System'"
echo "3. Crea un repositorio en GitHub"
echo "4. Agrega el remote: git remote add origin <URL>"
echo "5. Sube el código: git push -u origin master"

