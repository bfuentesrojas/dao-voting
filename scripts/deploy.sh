#!/bin/bash

# Script unificado para levantar todo el ambiente del proyecto DAO
# Inicia Anvil, despliega contratos, y levanta frontend/backend
# Uso: bash scripts/deploy.sh

set -e

# Obtener el directorio del script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONTRACTS_DIR="$PROJECT_ROOT/contracts"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuración
ANVIL_RPC_URL="http://localhost:8545"
ANVIL_LOG_FILE="/tmp/anvil_dao.log"
ANVIL_PID_FILE="/tmp/anvil_dao.pid"
FRONTEND_PORT=3000
BACKEND_PORT=3001
DEFAULT_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

# Variables para tracking de procesos
ANVIL_STARTED_BY_SCRIPT=false
FRONTEND_PID=""
BACKEND_PID=""
DAEMON_PID=""

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo -e "${YELLOW}🧹 Limpiando procesos...${NC}"
    
    # Detener Anvil si fue iniciado por este script
    if [ "$ANVIL_STARTED_BY_SCRIPT" = true ] && [ -f "$ANVIL_PID_FILE" ]; then
        ANVIL_PID=$(cat "$ANVIL_PID_FILE")
        if kill -0 "$ANVIL_PID" 2>/dev/null; then
            echo -e "${YELLOW}   Deteniendo Anvil (PID: $ANVIL_PID)...${NC}"
            kill "$ANVIL_PID" 2>/dev/null || true
        fi
        rm -f "$ANVIL_PID_FILE"
    fi
    
    # Detener frontend
    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo -e "${YELLOW}   Deteniendo frontend (PID: $FRONTEND_PID)...${NC}"
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    if lsof -ti:$FRONTEND_PORT > /dev/null 2>&1; then
        lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
    fi
    
    # Detener backend
    if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo -e "${YELLOW}   Deteniendo backend (PID: $BACKEND_PID)...${NC}"
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if lsof -ti:$BACKEND_PORT > /dev/null 2>&1; then
        lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
    fi
    
    # Detener daemon
    if [ -n "$DAEMON_PID" ] && kill -0 "$DAEMON_PID" 2>/dev/null; then
        echo -e "${YELLOW}   Deteniendo daemon (PID: $DAEMON_PID)...${NC}"
        kill "$DAEMON_PID" 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✅ Limpieza completada${NC}"
}

# Registrar función de limpieza
trap cleanup EXIT INT TERM

# Función para verificar si Anvil está corriendo
check_anvil() {
    if curl -s "$ANVIL_RPC_URL" > /dev/null 2>&1; then
        local response=$(curl -s -X POST "$ANVIL_RPC_URL" \
            -H "Content-Type: application/json" \
            -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' 2>/dev/null)
        
        if echo "$response" | grep -q "31337\|0x7a69"; then
            return 0
        fi
    fi
    return 1
}

# Función para iniciar Anvil en background
start_anvil() {
    echo -e "${YELLOW}⚠️  Anvil no está corriendo. Iniciando Anvil...${NC}"
    
    # Verificar que anvil esté instalado
    if ! command -v anvil &> /dev/null; then
        echo -e "${RED}❌ Error: Anvil no está instalado${NC}"
        echo "Instala Foundry con: curl -L https://foundry.paradigm.xyz | bash"
        exit 1
    fi
    
    # Iniciar Anvil en background
    anvil > "$ANVIL_LOG_FILE" 2>&1 &
    ANVIL_PID=$!
    echo "$ANVIL_PID" > "$ANVIL_PID_FILE"
    echo -e "${CYAN}   Anvil iniciado con PID: $ANVIL_PID${NC}"
    echo -e "${CYAN}   Logs guardados en: $ANVIL_LOG_FILE${NC}"
    
    # Esperar a que Anvil esté listo
    echo -n "   Esperando a que Anvil esté listo"
    for i in {1..30}; do
        if check_anvil; then
            echo ""
            echo -e "${GREEN}✅ Anvil está listo${NC}"
            ANVIL_STARTED_BY_SCRIPT=true
            return 0
        fi
        echo -n "."
        sleep 1
    done
    echo ""
    echo -e "${RED}❌ Error: Anvil no respondió a tiempo${NC}"
    echo "Revisa los logs: cat $ANVIL_LOG_FILE"
    kill $ANVIL_PID 2>/dev/null || true
    rm -f "$ANVIL_PID_FILE"
    exit 1
}

# Función para verificar dependencias
check_dependencies() {
    # Verificar dependencias de contratos
    if [ ! -d "$CONTRACTS_DIR/lib" ]; then
        echo -e "${YELLOW}⚠️  Librerías de contratos no instaladas${NC}"
        echo -e "${CYAN}   Instalando dependencias de contratos...${NC}"
        cd "$CONTRACTS_DIR"
        forge install
        cd "$PROJECT_ROOT"
        echo -e "${GREEN}✅ Dependencias de contratos instaladas${NC}"
    fi
    
    # Verificar dependencias del frontend
    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        echo -e "${YELLOW}⚠️  Dependencias del frontend no instaladas${NC}"
        echo -e "${CYAN}   Instalando dependencias del frontend...${NC}"
        cd "$FRONTEND_DIR"
        npm install
        cd "$PROJECT_ROOT"
        echo -e "${GREEN}✅ Dependencias del frontend instaladas${NC}"
    fi
    
    # Verificar dependencias del backend
    if [ ! -d "$BACKEND_DIR/node_modules" ]; then
        echo -e "${YELLOW}⚠️  Dependencias del backend no instaladas${NC}"
        echo -e "${CYAN}   Instalando dependencias del backend...${NC}"
        cd "$BACKEND_DIR"
        npm install
        cd "$PROJECT_ROOT"
        echo -e "${GREEN}✅ Dependencias del backend instaladas${NC}"
    fi
}

echo -e "${BLUE}🚀 Iniciando proyecto DAO completo...${NC}"
echo ""

# Verificar e instalar dependencias
check_dependencies

# Verificar si Anvil está corriendo
if check_anvil; then
    echo -e "${GREEN}✅ Anvil ya está corriendo${NC}"
else
    start_anvil
fi

# Verificación adicional: intentar hacer una llamada RPC simple
echo -e "${CYAN}   Verificando conexión RPC...${NC}"
if ! curl -s -X POST "$ANVIL_RPC_URL" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: No se puede conectar a Anvil en $ANVIL_RPC_URL${NC}"
    echo "Asegúrate de que Anvil esté corriendo y accesible"
    exit 1
fi

# Compilar contratos
echo ""
echo -e "${BLUE}📦 Compilando contratos...${NC}"
cd "$CONTRACTS_DIR"
if ! forge build > /dev/null 2>&1; then
    echo -e "${RED}❌ Error al compilar contratos${NC}"
    forge build
    exit 1
fi
echo -e "${GREEN}✅ Contratos compilados correctamente${NC}"

# Desplegar contratos usando el script Solidity
echo ""
echo -e "${BLUE}🔨 Desplegando contratos...${NC}"
DEPLOY_OUTPUT=$(forge script script/Deploy.s.sol:DeployScript \
    --rpc-url "$ANVIL_RPC_URL" \
    --broadcast \
    --private-key "$DEFAULT_PRIVATE_KEY" 2>&1)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Contratos desplegados correctamente${NC}"
    
    # Extraer direcciones de los contratos desde los archivos de broadcast (más confiable)
    BROADCAST_DIR="$CONTRACTS_DIR/broadcast/Deploy.s.sol/31337"
    LATEST_RUN="$BROADCAST_DIR/run-latest.json"
    
    if [ -f "$LATEST_RUN" ]; then
        # Intentar extraer desde JSON usando jq si está disponible
        if command -v jq &> /dev/null; then
            FORWARDER_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "MinimalForwarder") | .contractAddress' "$LATEST_RUN" 2>/dev/null | head -1)
            DAO_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "DAOVoting") | .contractAddress' "$LATEST_RUN" 2>/dev/null | head -1)
        else
            # Fallback: usar grep para extraer direcciones del JSON
            FORWARDER_ADDRESS=$(grep -oP '"contractName":\s*"MinimalForwarder"[^}]*"contractAddress":\s*"\K0x[a-fA-F0-9]{40}' "$LATEST_RUN" 2>/dev/null | head -1)
            DAO_ADDRESS=$(grep -oP '"contractName":\s*"DAOVoting"[^}]*"contractAddress":\s*"\K0x[a-fA-F0-9]{40}' "$LATEST_RUN" 2>/dev/null | head -1)
        fi
    fi
    
    # Si no se encontraron en broadcast, intentar desde el output de console
    if [ -z "$FORWARDER_ADDRESS" ] || [ -z "$DAO_ADDRESS" ]; then
        FORWARDER_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -oP "MinimalForwarder desplegado en: \K0x[a-fA-F0-9]{40}" | head -1)
        DAO_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -oP "DAOVoting desplegado en: \K0x[a-fA-F0-9]{40}" | head -1)
    fi
    
    # Último intento: buscar cualquier dirección relacionada
    if [ -z "$FORWARDER_ADDRESS" ] || [ -z "$DAO_ADDRESS" ]; then
        FORWARDER_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -i "MinimalForwarder" | grep -oP "0x[a-fA-F0-9]{40}" | head -1)
        DAO_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -i "DAOVoting" | grep -oP "0x[a-fA-F0-9]{40}" | head -1)
    fi
    
    # Actualizar .env.local del frontend
    if [ -n "$FORWARDER_ADDRESS" ] && [ -n "$DAO_ADDRESS" ]; then
        echo ""
        echo -e "${BLUE}📝 Actualizando configuración del frontend...${NC}"
        FRONTEND_ENV="$FRONTEND_DIR/.env.local"
        
        # Crear o actualizar .env.local
        if [ ! -f "$FRONTEND_ENV" ]; then
            touch "$FRONTEND_ENV"
        fi
        
        # Actualizar o agregar variables
        if grep -q "NEXT_PUBLIC_FORWARDER_ADDRESS" "$FRONTEND_ENV"; then
            sed -i "s|NEXT_PUBLIC_FORWARDER_ADDRESS=.*|NEXT_PUBLIC_FORWARDER_ADDRESS=$FORWARDER_ADDRESS|" "$FRONTEND_ENV"
        else
            echo "NEXT_PUBLIC_FORWARDER_ADDRESS=$FORWARDER_ADDRESS" >> "$FRONTEND_ENV"
        fi
        
        if grep -q "NEXT_PUBLIC_DAO_ADDRESS" "$FRONTEND_ENV"; then
            sed -i "s|NEXT_PUBLIC_DAO_ADDRESS=.*|NEXT_PUBLIC_DAO_ADDRESS=$DAO_ADDRESS|" "$FRONTEND_ENV"
        else
            echo "NEXT_PUBLIC_DAO_ADDRESS=$DAO_ADDRESS" >> "$FRONTEND_ENV"
        fi
        
        if grep -q "NEXT_PUBLIC_RPC_URL" "$FRONTEND_ENV"; then
            sed -i "s|NEXT_PUBLIC_RPC_URL=.*|NEXT_PUBLIC_RPC_URL=$ANVIL_RPC_URL|" "$FRONTEND_ENV"
        else
            echo "NEXT_PUBLIC_RPC_URL=$ANVIL_RPC_URL" >> "$FRONTEND_ENV"
        fi
        
        if ! grep -q "NEXT_PUBLIC_CHAIN_ID" "$FRONTEND_ENV"; then
            echo "NEXT_PUBLIC_CHAIN_ID=31337" >> "$FRONTEND_ENV"
        fi
        
        echo -e "${GREEN}✅ Configuración actualizada en frontend/.env.local:${NC}"
        echo -e "   ${CYAN}MinimalForwarder:${NC} $FORWARDER_ADDRESS"
        echo -e "   ${CYAN}DAOVoting:${NC} $DAO_ADDRESS"
        echo -e "${YELLOW}   Nota:${NC} El frontend se reiniciará automáticamente para cargar las nuevas variables"
    else
        echo -e "${YELLOW}⚠️  No se pudieron extraer las direcciones automáticamente${NC}"
        echo -e "${YELLOW}   Por favor, configura manualmente frontend/.env.local${NC}"
        echo ""
        echo "$DEPLOY_OUTPUT"
    fi
else
    echo -e "${RED}❌ Error durante el despliegue${NC}"
    echo "$DEPLOY_OUTPUT"
    exit 1
fi

cd "$PROJECT_ROOT"

# Verificar que Anvil esté completamente estable antes de iniciar frontend
echo ""
echo -e "${CYAN}🔍 Verificando que Anvil esté completamente estable...${NC}"
for i in {1..10}; do
    if curl -s -X POST "$ANVIL_RPC_URL" \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Anvil está estable${NC}"
        break
    fi
    if [ $i -eq 10 ]; then
        echo -e "${RED}❌ Anvil no está respondiendo correctamente${NC}"
        exit 1
    fi
    sleep 0.5
done

# Pequeño delay adicional para asegurar estabilidad
sleep 2

# Verificar y liberar puerto 3000 para frontend
if lsof -ti:$FRONTEND_PORT > /dev/null 2>&1; then
    echo ""
    echo -e "${YELLOW}⚠️  El puerto $FRONTEND_PORT está ocupado${NC}"
    echo -e "${CYAN}   Deteniendo proceso en puerto $FRONTEND_PORT...${NC}"
    lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Iniciar frontend
echo ""
echo -e "${BLUE}🌐 Iniciando frontend en puerto $FRONTEND_PORT...${NC}"
cd "$FRONTEND_DIR"
npm run dev > /tmp/frontend_dao.log 2>&1 &
FRONTEND_PID=$!

# Esperar a que el frontend esté listo
echo -n "   Esperando a que el frontend esté listo"
for i in {1..30}; do
    if curl -s "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
        echo ""
        echo -e "${GREEN}✅ Frontend está listo${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Verificar y liberar puerto 3001 para backend
if lsof -ti:$BACKEND_PORT > /dev/null 2>&1; then
    echo ""
    echo -e "${YELLOW}⚠️  El puerto $BACKEND_PORT está ocupado${NC}"
    echo -e "${CYAN}   Deteniendo proceso en puerto $BACKEND_PORT...${NC}"
    lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Iniciar backend (opcional, solo si existe .env)
if [ -f "$BACKEND_DIR/.env" ]; then
    echo ""
    echo -e "${BLUE}⚙️  Iniciando backend en puerto $BACKEND_PORT...${NC}"
    cd "$BACKEND_DIR"
    npm run dev > /tmp/backend_dao.log 2>&1 &
    BACKEND_PID=$!
    
    # Esperar a que el backend esté listo
    echo -n "   Esperando a que el backend esté listo"
    for i in {1..30}; do
        if curl -s "http://localhost:$BACKEND_PORT" > /dev/null 2>&1; then
            echo ""
            echo -e "${GREEN}✅ Backend está listo${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done
    
    # Iniciar daemon si está configurado
    if grep -q "DAEMON_PRIVATE_KEY" "$BACKEND_DIR/.env" && grep -q "DAO_CONTRACT_ADDRESS" "$BACKEND_DIR/.env"; then
        echo ""
        echo -e "${BLUE}🤖 Iniciando daemon de ejecución...${NC}"
        npm run daemon > /tmp/daemon_dao.log 2>&1 &
        DAEMON_PID=$!
        echo -e "${GREEN}✅ Daemon iniciado${NC}"
    fi
fi

cd "$PROJECT_ROOT"

# Mostrar resumen
echo ""
echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✨ Proyecto iniciado correctamente${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}📋 Información útil:${NC}"
echo -e "   ${BLUE}Frontend:${NC} http://localhost:$FRONTEND_PORT"
if [ -n "$BACKEND_PID" ]; then
    echo -e "   ${BLUE}Backend:${NC} http://localhost:$BACKEND_PORT"
fi
echo -e "   ${BLUE}RPC URL:${NC} $ANVIL_RPC_URL"
echo -e "   ${BLUE}Chain ID:${NC} 31337 (Anvil local)"
echo ""
echo -e "${CYAN}📝 Logs:${NC}"
echo -e "   ${BLUE}Anvil:${NC} tail -f $ANVIL_LOG_FILE"
echo -e "   ${BLUE}Frontend:${NC} tail -f /tmp/frontend_dao.log"
if [ -n "$BACKEND_PID" ]; then
    echo -e "   ${BLUE}Backend:${NC} tail -f /tmp/backend_dao.log"
    if [ -n "$DAEMON_PID" ]; then
        echo -e "   ${BLUE}Daemon:${NC} tail -f /tmp/daemon_dao.log"
    fi
fi
echo ""
echo -e "${YELLOW}💡 Presiona Ctrl+C para detener todos los servicios${NC}"
echo ""

# Mantener el script corriendo
wait
