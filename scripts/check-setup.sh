#!/bin/bash

echo "🔍 Verificando configuración del proyecto DAO..."
echo ""

# Verificar Foundry
echo "📦 Verificando Foundry..."
if command -v forge &> /dev/null; then
    echo "✅ Foundry está instalado"
    forge --version
else
    echo "❌ Foundry no está instalado. Instala con: curl -L https://foundry.paradigm.xyz | bash"
fi
echo ""

# Verificar Node.js
echo "📦 Verificando Node.js..."
if command -v node &> /dev/null; then
    echo "✅ Node.js está instalado"
    node --version
else
    echo "❌ Node.js no está instalado"
fi
echo ""

# Verificar dependencias del frontend
echo "📦 Verificando dependencias del frontend..."
if [ -d "frontend/node_modules" ]; then
    echo "✅ Dependencias del frontend instaladas"
else
    echo "❌ Dependencias del frontend no instaladas. Ejecuta: cd frontend && npm install"
fi
echo ""

# Verificar dependencias del backend
echo "📦 Verificando dependencias del backend..."
if [ -d "backend/node_modules" ]; then
    echo "✅ Dependencias del backend instaladas"
else
    echo "❌ Dependencias del backend no instaladas. Ejecuta: cd backend && npm install"
fi
echo ""

# Verificar contratos
echo "📦 Verificando contratos..."
if [ -d "contracts/lib" ]; then
    echo "✅ Librerías de contratos instaladas"
else
    echo "❌ Librerías de contratos no instaladas. Ejecuta: cd contracts && forge install"
fi
echo ""

# Intentar compilar contratos
echo "🔨 Compilando contratos..."
cd contracts
if forge build &> /dev/null; then
    echo "✅ Contratos compilados correctamente"
else
    echo "❌ Error al compilar contratos"
fi
cd ..
echo ""

echo "✨ Verificación completada!"


