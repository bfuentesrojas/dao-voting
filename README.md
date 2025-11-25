# 🗳️ DAO Voting - Sistema de Gobernanza Descentralizada

Sistema completo de DAO (Decentralized Autonomous Organization) con contratos inteligentes, frontend Next.js y backend TypeScript. Incluye votación sin gas (gasless) mediante meta-transacciones EIP-2771.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Testing](#-testing)
- [Documentación Adicional](#-documentación-adicional)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

## ✨ Características

### Contratos Inteligentes
- ✅ **DAOVoting**: Contrato principal de gobernanza con sistema de propuestas y votación
- ✅ **MinimalForwarder**: Implementación EIP-2771 para meta-transacciones (votación sin gas)
- ✅ **Sistema de Propuestas**: Creación, votación y ejecución de propuestas
- ✅ **Control de Acceso**: Requisito de balance mínimo (10%) para crear propuestas
- ✅ **Seguridad**: Delay de ejecución y validaciones de deadline

### Frontend
- ✅ **Conexión con MetaMask**: Integración completa con wallets
- ✅ **Panel de Financiación**: Depositar ETH en el DAO
- ✅ **Creación de Propuestas**: Formulario intuitivo para nuevas propuestas
- ✅ **Listado de Propuestas**: Visualización de todas las propuestas con estado
- ✅ **Votación Gasless**: Votar sin pagar gas usando meta-transacciones
- ✅ **Componente de Prueba Integrada**: Para testing end-to-end (solo desarrollo)

### Backend
- ✅ **API Relayer**: Endpoint para procesar meta-transacciones
- ✅ **Daemon de Ejecución**: Proceso automático que ejecuta propuestas aprobadas
- ✅ **API Routes**: Endpoints para propuestas, votación y daemon

## 🛠️ Tecnologías

### Blockchain
- **Solidity** 0.8.25
- **Foundry** (Forge, Anvil, Cast)
- **OpenZeppelin Contracts** v5.x

### Frontend
- **Next.js** 15 (App Router)
- **TypeScript**
- **React** 18
- **Tailwind CSS**
- **Wagmi** v2 + **RainbowKit**
- **ethers.js** v6

### Backend
- **TypeScript**
- **Node.js**
- **Express**
- **ethers.js** v6

### Desarrollo
- **Anvil** (blockchain local)
- **MetaMask** (wallet)
- **EIP-2771** (meta-transacciones)

## 📁 Estructura del Proyecto

```
dao/
├── contracts/              # Contratos Solidity con Foundry
│   ├── src/               # Código fuente de contratos
│   │   ├── DAOVoting.sol  # Contrato principal del DAO
│   │   └── MinimalForwarder.sol  # Forwarder EIP-2771
│   ├── test/              # Tests de contratos
│   │   ├── DAOVoting.t.sol
│   │   ├── MinimalForwarder.t.sol
│   │   ├── Deploy.t.sol
│   │   └── FullScenario.t.sol  # Test completo del escenario
│   ├── script/            # Scripts de despliegue
│   │   └── Deploy.s.sol
│   ├── lib/               # Dependencias (OpenZeppelin, forge-std)
│   └── foundry.toml       # Configuración de Foundry
│
├── frontend/              # DApp Next.js
│   ├── src/
│   │   ├── app/           # Páginas y rutas (App Router)
│   │   │   ├── api/       # API Routes
│   │   │   │   ├── daemon/route.ts
│   │   │   │   ├── relay/route.ts
│   │   │   │   ├── proposal/[id]/route.ts
│   │   │   │   └── vote/route.ts
│   │   │   ├── page.tsx   # Página principal
│   │   │   ├── layout.tsx
│   │   │   └── providers.tsx
│   │   ├── components/    # Componentes React
│   │   │   ├── ConnectWallet.tsx
│   │   │   ├── FundingPanel.tsx
│   │   │   ├── CreateProposal.tsx
│   │   │   ├── ProposalList.tsx
│   │   │   ├── ProposalCard.tsx
│   │   │   ├── VoteButtons.tsx
│   │   │   └── IntegrationTest.tsx  # Solo desarrollo
│   │   ├── hooks/         # Custom hooks
│   │   │   ├── useDAO.ts
│   │   │   └── useWallet.ts
│   │   ├── contexts/      # React Contexts
│   │   │   └── WalletContext.tsx
│   │   └── lib/           # Utilidades
│   │       ├── config.ts
│   │       ├── contracts.ts
│   │       ├── metaTx.ts
│   │       ├── signing.ts
│   │       └── utils.ts
│   └── package.json
│
├── backend/               # Backend TypeScript
│   ├── src/
│   │   ├── index.ts       # Servidor Express
│   │   ├── daemon.ts      # Daemon de ejecución
│   │   └── contracts.ts   # Utilidades de contratos
│   └── package.json
│
├── scripts/                # Scripts generales
│   ├── deploy.sh          # Script de despliegue completo
│   ├── check-setup.sh     # Verificar configuración
│   ├── fund-account.sh    # Fondear cuentas
│   ├── setup-test-data.js # Preparar datos de prueba
│   └── test-integration-frontend.js  # Test integrado
│
├── DATOS_PRUEBA_MANUAL.md # Guía de pruebas manuales
└── README.md              # Este archivo
```

## 🚀 Instalación

### Prerrequisitos

- **Node.js** 18+ y npm
- **Foundry** (forge, cast, anvil)
- **Git**

### 1. Instalar Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

Verifica la instalación:
```bash
forge --version
anvil --version
```

### 2. Clonar el Repositorio

```bash
git clone <repository-url>
cd dao
```

### 3. Instalar Dependencias

```bash
# Frontend
cd frontend
npm install
cd ..

# Backend
cd backend
npm install
cd ..

# Contratos (instalar dependencias de Foundry)
cd contracts
forge install
cd ..
```

## ⚙️ Configuración

### 1. Desplegar Contratos

Usa el script automatizado (recomendado):

```bash
bash scripts/deploy.sh
```

Este script:
- Inicia Anvil (blockchain local)
- Despliega los contratos
- Guarda las direcciones en `frontend/.env.local`
- Inicia el frontend

**O manualmente:**

```bash
# Terminal 1: Iniciar Anvil
anvil

# Terminal 2: Desplegar contratos
cd contracts
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url http://localhost:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### 2. Configurar Variables de Entorno

El script `deploy.sh` crea automáticamente `frontend/.env.local` con las direcciones de los contratos.

**Si lo haces manualmente, crea `frontend/.env.local`:**

```env
# Red
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337

# Direcciones de contratos (actualizar después del despliegue)
NEXT_PUBLIC_DAO_ADDRESS=0x...
NEXT_PUBLIC_FORWARDER_ADDRESS=0x...

# Relayer (paga gas de meta-transacciones)
RELAYER_PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
RELAYER_ADDRESS=0x70997970C51812dc3A010C7d01b50e0d17dc79C8

# Daemon (ejecuta propuestas)
DAEMON_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Componente de prueba integrada (solo desarrollo)
NEXT_PUBLIC_ENABLE_INTEGRATION_TEST=true
```

**Backend (`backend/.env`):**

```env
RPC_URL=http://localhost:8545
DAO_CONTRACT_ADDRESS=0x...
DAEMON_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
DAEMON_INTERVAL=60
```

## 💻 Uso

### Desarrollo Local

#### Opción 1: Script Automatizado (Recomendado)

```bash
bash scripts/deploy.sh
```

Este script levanta todo el ambiente automáticamente.

#### Opción 2: Manual

**Terminal 1: Anvil**
```bash
anvil
```

**Terminal 2: Frontend**
```bash
cd frontend
npm run dev
```

**Terminal 3: Backend (Opcional)**
```bash
cd backend
npm run dev
```

**Terminal 4: Daemon (Opcional)**
```bash
cd backend
npm run daemon
```

### Acceder a la Aplicación

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001 (si está corriendo)

### Funcionalidades del Frontend

1. **Conectar Wallet**: Haz clic en "Conectar Wallet" y selecciona MetaMask
2. **Financiar DAO**: Deposita ETH en el DAO usando el panel "Financiar DAO"
3. **Crear Propuesta**: Usa el formulario "Crear Propuesta" (requiere >10% del balance total)
4. **Ver Propuestas**: Todas las propuestas se muestran en la lista
5. **Votar**: Haz clic en una propuesta y vota (A FAVOR, EN CONTRA, ABSTENCIÓN)
   - Puedes votar sin gas usando la opción "Votación sin gas"
6. **Ejecutar Propuesta**: El daemon ejecuta automáticamente las propuestas aprobadas después del deadline

### Configurar MetaMask para Pruebas

Ver la guía completa en [`DATOS_PRUEBA_MANUAL.md`](./DATOS_PRUEBA_MANUAL.md)

**Resumen rápido:**

1. **Importar cuentas de prueba:**
   - Usuario A: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
   - Usuario B: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`
   - Usuario C: `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6`

2. **Agregar red Anvil:**
   - Nombre: `Anvil Local`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `31337`
   - Símbolo: `ETH`

## 🧪 Testing

### Tests de Contratos (Foundry)

```bash
cd contracts

# Ejecutar todos los tests
forge test

# Ejecutar test específico
forge test --match-test test_FullScenario

# Con verbosidad
forge test -vvv

# Con gas report
forge test --gas-report
```

### Preparar Datos de Prueba

```bash
# Asegúrate de que Anvil esté corriendo y los contratos desplegados
cd frontend
node ../scripts/setup-test-data.js
```

Este script crea:
- Depósitos de usuarios (A: 10 ETH, B: 1 ETH, C: 20 ETH)
- Una propuesta de prueba
- Votos de los tres usuarios

### Test Integrado (Node.js)

```bash
# Ejecuta el escenario completo
node scripts/test-integration-frontend.js
```

### Test Integrado (Frontend)

1. Abre el frontend: http://localhost:3000
2. Conecta tu wallet
3. Ve a la sección "Prueba Integrada" (solo visible si `NEXT_PUBLIC_ENABLE_INTEGRATION_TEST=true`)
4. Haz clic en "Ejecutar Prueba Integrada"

## 📚 Documentación Adicional

- **[DATOS_PRUEBA_MANUAL.md](./DATOS_PRUEBA_MANUAL.md)**: Guía completa para pruebas manuales con MetaMask
- **[PRUEBA_INTEGRADA.md](./PRUEBA_INTEGRADA.md)**: Documentación del sistema de pruebas integradas
- **[VERIFICACION_FRONTEND.md](./VERIFICACION_FRONTEND.md)**: Verificación de requisitos del frontend
- **[contracts/README.md](./contracts/README.md)**: Documentación específica de Foundry

## 🔧 Scripts Útiles

### Contratos

```bash
cd contracts

# Compilar
forge build

# Formatear código
forge fmt

# Ejecutar script de despliegue
forge script script/Deploy.s.sol:DeployScript --rpc-url http://localhost:8545 --broadcast

# Verificar contrato (si está en una red pública)
forge verify-contract <ADDRESS> <CONTRACT> --chain-id <CHAIN_ID>
```

### Frontend

```bash
cd frontend

# Desarrollo
npm run dev

# Build de producción
npm run build

# Iniciar producción
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

### Backend

```bash
cd backend

# Desarrollo
npm run dev

# Build
npm run build

# Iniciar producción
npm start

# Daemon
npm run daemon
```

### Scripts Generales

```bash
# Desplegar todo el ambiente
bash scripts/deploy.sh

# Verificar configuración
bash scripts/check-setup.sh

# Fondear una cuenta
bash scripts/fund-account.sh <ADDRESS> <AMOUNT>

# Preparar datos de prueba
node scripts/setup-test-data.js

# Test integrado
node scripts/test-integration-frontend.js
```

## 🏗️ Arquitectura

### Flujo de Votación Gasless

1. Usuario firma una meta-transacción (EIP-712) en el frontend
2. Frontend envía la firma al relayer (`/api/relay`)
3. Relayer verifica la firma y ejecuta la transacción pagando el gas
4. El contrato `MinimalForwarder` valida y reenvía la llamada al `DAOVoting`
5. El voto se registra en el contrato

### Flujo de Ejecución de Propuestas

1. Propuesta creada con deadline
2. Usuarios votan (A FAVOR, EN CONTRA, ABSTENCIÓN)
3. Después del deadline, si `votesFor > votesAgainst`, la propuesta está aprobada
4. Daemon verifica periódicamente propuestas aprobadas
5. Daemon ejecuta la propuesta (transferencia de fondos)
6. Propuesta marcada como ejecutada

### Seguridad

- **Delay de ejecución**: Después de aprobar, hay un delay antes de ejecutar
- **Validación de balance**: Requiere >10% del balance total para crear propuestas
- **Deadline**: Las propuestas solo pueden ejecutarse después del deadline
- **Meta-transacciones**: Validación EIP-712 para prevenir replay attacks

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Estándares de Código

- **Solidity**: Usa `forge fmt` para formatear
- **TypeScript**: Sigue las reglas de ESLint
- **Commits**: Usa mensajes descriptivos en español o inglés

## 📝 Notas Importantes

- ⚠️ **Las claves privadas en este proyecto son SOLO para desarrollo** - NUNCA las uses en mainnet
- ⚠️ **Anvil es una blockchain local** - Todos los datos se pierden al reiniciar
- ⚠️ **El componente de prueba integrada solo debe estar activo en desarrollo**
- ✅ **Todos los usuarios en Anvil tienen 10000 ETH por defecto**
- ✅ **El relayer necesita ETH para pagar el gas de meta-transacciones**

## 🐛 Solución de Problemas

### Error: "RPC endpoint returned too many errors"
- Verifica que Anvil esté corriendo: `anvil`
- Espera unos segundos y recarga la página
- Reinicia Anvil si es necesario

### Error: "Insufficient balance to create proposal"
- Necesitas tener >10% del balance total del DAO
- Deposita más ETH usando el panel "Financiar DAO"

### Error: "Nonce too low"
- Espera unos segundos entre transacciones
- Recarga la página para sincronizar el nonce

### El componente de prueba no aparece
- Verifica que `NEXT_PUBLIC_ENABLE_INTEGRATION_TEST=true` en `.env.local`
- Reinicia el servidor de Next.js

### Contratos no se despliegan
- Asegúrate de estar en el directorio `contracts/` al ejecutar comandos de Foundry
- Verifica que Anvil esté corriendo
- Revisa que la clave privada tenga fondos

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Autores

- **Tu Nombre** - [@tuusuario](https://github.com/tuusuario)

## 🙏 Agradecimientos

- **OpenZeppelin** por los contratos base
- **Foundry** por las herramientas de desarrollo
- **Wagmi** y **RainbowKit** por la integración de wallets
- La comunidad de Ethereum por los estándares EIP-2771

---

**¿Necesitas ayuda?** Abre un issue en GitHub o consulta la documentación adicional en los archivos `.md` del proyecto.
