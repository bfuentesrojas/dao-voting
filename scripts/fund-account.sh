#!/bin/bash

# Script para agregar ether a una cuenta de Anvil
# Uso: bash scripts/fund-account.sh [dirección_destino] [cantidad_ether]

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

ANVIL_RPC_URL="http://localhost:8545"
DEFAULT_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

# Función para obtener las cuentas de Anvil
get_anvil_accounts() {
    echo -e "${BLUE}📋 Cuentas disponibles en Anvil:${NC}"
    echo ""
    
    # Obtener cuentas usando cast
    if command -v cast &> /dev/null; then
        for i in {0..9}; do
            # Calcular la clave privada (Anvil usa claves secuenciales)
            # La primera cuenta usa la clave por defecto
            if [ $i -eq 0 ]; then
                PRIVATE_KEY="$DEFAULT_PRIVATE_KEY"
            else
                # Anvil genera claves incrementando en 1
                # Esto es una aproximación, mejor usar cast wallet address
                PRIVATE_KEY=$(cast wallet address --private-key $DEFAULT_PRIVATE_KEY 2>/dev/null || echo "")
            fi
            
            # Obtener dirección desde la clave privada
            ADDRESS=$(cast wallet address --private-key $DEFAULT_PRIVATE_KEY 2>/dev/null || echo "")
            
            if [ -n "$ADDRESS" ]; then
                # Obtener balance
                BALANCE=$(cast balance "$ADDRESS" --rpc-url "$ANVIL_RPC_URL" 2>/dev/null || echo "0")
                BALANCE_ETH=$(cast --to-unit "$BALANCE" ether 2>/dev/null || echo "0")
                echo -e "   ${CYAN}Cuenta $i:${NC} $ADDRESS ${GREEN}($BALANCE_ETH ETH)${NC}"
            fi
        done
    else
        echo -e "${YELLOW}⚠️  Cast no está instalado. Instala Foundry para usar este script.${NC}"
    fi
}

# Función para enviar ether
send_ether() {
    local TO_ADDRESS=$1
    local AMOUNT=$2
    
    if [ -z "$TO_ADDRESS" ] || [ -z "$AMOUNT" ]; then
        echo -e "${RED}❌ Error: Debes proporcionar dirección de destino y cantidad${NC}"
        echo ""
        echo "Uso: bash scripts/fund-account.sh [dirección] [cantidad_ether]"
        echo ""
        echo "Ejemplo:"
        echo "  bash scripts/fund-account.sh 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 100"
        exit 1
    fi
    
    # Validar dirección
    if ! cast --to-checksum-address "$TO_ADDRESS" &>/dev/null; then
        echo -e "${RED}❌ Error: Dirección inválida${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}💸 Enviando $AMOUNT ETH a $TO_ADDRESS...${NC}"
    
    # Enviar ether usando cast
    if cast send "$TO_ADDRESS" --value "$(cast --to-wei "$AMOUNT" ether)" \
        --rpc-url "$ANVIL_RPC_URL" \
        --private-key "$DEFAULT_PRIVATE_KEY" \
        --json > /dev/null 2>&1; then
        
        echo -e "${GREEN}✅ Ether enviado correctamente${NC}"
        
        # Mostrar nuevo balance
        NEW_BALANCE=$(cast balance "$TO_ADDRESS" --rpc-url "$ANVIL_RPC_URL" 2>/dev/null || echo "0")
        NEW_BALANCE_ETH=$(cast --to-unit "$NEW_BALANCE" ether 2>/dev/null || echo "0")
        echo -e "${CYAN}   Nuevo balance: $NEW_BALANCE_ETH ETH${NC}"
    else
        echo -e "${RED}❌ Error al enviar ether${NC}"
        echo "Verifica que Anvil esté corriendo: curl $ANVIL_RPC_URL"
        exit 1
    fi
}

# Verificar que Anvil esté corriendo
if ! curl -s "$ANVIL_RPC_URL" > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Anvil no está corriendo${NC}"
    echo "Inicia Anvil primero con: bash scripts/start.sh"
    exit 1
fi

# Verificar que cast esté instalado
if ! command -v cast &> /dev/null; then
    echo -e "${RED}❌ Error: Cast no está instalado${NC}"
    echo "Instala Foundry con: curl -L https://foundry.paradigm.xyz | bash"
    exit 1
fi

# Si se proporcionaron argumentos, enviar ether
if [ $# -eq 2 ]; then
    send_ether "$1" "$2"
else
    # Mostrar información de cuentas
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "${BLUE}💰 Gestión de Fondos en Anvil${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo ""
    
    # Mostrar cuenta por defecto (primera cuenta de Anvil)
    DEFAULT_ADDRESS=$(cast wallet address --private-key "$DEFAULT_PRIVATE_KEY" 2>/dev/null || echo "")
    if [ -n "$DEFAULT_ADDRESS" ]; then
        DEFAULT_BALANCE=$(cast balance "$DEFAULT_ADDRESS" --rpc-url "$ANVIL_RPC_URL" 2>/dev/null || echo "0")
        DEFAULT_BALANCE_ETH=$(cast --to-unit "$DEFAULT_BALANCE" ether 2>/dev/null || echo "0")
        echo -e "${GREEN}✅ Cuenta por defecto (con fondos):${NC}"
        echo -e "   ${CYAN}Dirección:${NC} $DEFAULT_ADDRESS"
        echo -e "   ${CYAN}Balance:${NC} $DEFAULT_BALANCE_ETH ETH"
        echo -e "   ${CYAN}Clave privada:${NC} $DEFAULT_PRIVATE_KEY"
        echo ""
    fi
    
    echo -e "${YELLOW}💡 Para enviar ether a otra cuenta:${NC}"
    echo "   bash scripts/fund-account.sh [dirección_destino] [cantidad_ether]"
    echo ""
    echo -e "${YELLOW}Ejemplo:${NC}"
    echo "   bash scripts/fund-account.sh 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 100"
    echo ""
    
    # Mostrar otras cuentas comunes de Anvil
    echo -e "${BLUE}📋 Otras cuentas comunes de Anvil (con 10,000 ETH cada una):${NC}"
    echo ""
    echo "   Cuenta 1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    echo "   Cuenta 2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
    echo "   Cuenta 3: 0x90F79bf6EB2c4f870365E785982E1f101E93b906"
    echo "   Cuenta 4: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"
    echo "   Cuenta 5: 0x9965507D1a55bcC2695C58ba16FB37d819F0A4bf"
    echo ""
    echo -e "${CYAN}💡 Nota:${NC} Anvil crea 10 cuentas por defecto, cada una con 10,000 ETH"
    echo -e "${CYAN}   Puedes usar cualquiera de estas cuentas en MetaMask${NC}"
fi



