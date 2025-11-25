# Datos de Prueba para Pruebas Manuales

Este documento contiene toda la información necesaria para realizar pruebas manuales del DAO.

## 🚀 Guía Rápida: Configurar MetaMask en 3 Pasos

### 1️⃣ Importar Cuentas (5 minutos)

1. Abre MetaMask → Icono de cuenta (arriba derecha) → **"Importar cuenta"**
2. Selecciona **"Clave privada"**
3. Pega una de estas claves y haz clic en **"Importar"**:
   - **Usuario A:** `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
   - **Usuario B:** `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`
   - **Usuario C:** `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6`
4. Repite para las otras dos cuentas

### 2️⃣ Configurar Red Anvil (2 minutos)

1. MetaMask → Menú (☰) → **"Configuración"** → **"Redes"**
2. **"Agregar red"** → **"Agregar red manualmente"**
3. Completa:
   - Nombre: `Anvil Local`
   - URL RPC: `http://localhost:8545`
   - ID de cadena: `31337`
   - Símbolo: `ETH`
4. **"Guardar"**

### 3️⃣ Conectar al Frontend

1. Asegúrate de que Anvil esté corriendo: `anvil`
2. Abre el frontend: `http://localhost:3000`
3. Haz clic en **"Conectar Wallet"** en el frontend
4. Selecciona una de las cuentas importadas

---

## 📖 Guía Detallada (Continúa abajo)

## 🔑 Claves Privadas de Usuarios de Prueba

Estas son las claves privadas de las cuentas de Anvil que puedes importar en MetaMask:

### Usuario A
- **Clave Privada:** `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
- **Dirección:** `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **Balance en DAO:** 60.0 ETH (puede variar)
- **Uso:** Tiene suficiente balance para crear propuestas (>10% del total)

### Usuario B
- **Clave Privada:** `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`
- **Dirección:** `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- **Balance en DAO:** 6.0 ETH (puede variar)
- **Uso:** NO tiene suficiente balance para crear propuestas (<10% del total)

### Usuario C
- **Clave Privada:** `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6`
- **Dirección:** `0x90F79bf6EB2c4f870365E785982E1f101E93b906`
- **Balance en DAO:** 80.0 ETH (puede variar)
- **Uso:** Tiene suficiente balance para crear propuestas

## 📋 Propuesta de Prueba Creada

Después de ejecutar `setup-test-data.js`, se crea una propuesta con:

- **ID:** Varía (última propuesta creada)
- **Proposer:** Usuario A (0x7099...79C8)
- **Monto:** 5 ETH
- **Recipient:** 0x1234567890123456789012345678901234567890
- **Deadline:** 7 días desde la creación
- **Votos:**
  - Usuario A: A FAVOR
  - Usuario B: EN CONTRA
  - Usuario C: A FAVOR
- **Estado:** APROBADA (2 a favor > 1 en contra)

## 🚀 Cómo Preparar los Datos de Prueba

Ejecuta el script de preparación:

```bash
# Desde el directorio raíz del proyecto
cd frontend
node ../scripts/setup-test-data.js
```

Este script:
1. Verifica y crea depósitos de usuarios (si no tienen suficiente)
2. Crea una propuesta de prueba
3. Registra votos de los tres usuarios
4. Muestra un resumen completo de los datos

## 🧪 Pasos para Pruebas Manuales

### 1. Preparar el Ambiente

```bash
# Asegúrate de que Anvil esté corriendo
anvil

# En otra terminal, prepara los datos
cd frontend
node ../scripts/setup-test-data.js
```

### 2. Importar Cuentas en MetaMask

#### Paso a Paso Detallado:

**Paso 1: Abrir MetaMask**
- Abre la extensión de MetaMask en tu navegador
- Si no tienes MetaMask instalado, descárgalo desde [metamask.io](https://metamask.io)
- Asegúrate de estar en la pantalla principal de MetaMask

**Paso 2: Acceder al Menú de Importación**
- Haz clic en el **icono de cuenta** (círculo con avatar) en la esquina superior derecha de MetaMask
- O haz clic en el **menú de tres líneas** (☰) en la esquina superior izquierda
- Busca y haz clic en **"Importar cuenta"** o **"Import Account"**

**Paso 3: Seleccionar Tipo de Importación**
- Se abrirá una ventana con opciones de importación
- Selecciona la opción **"Clave privada"** o **"Private Key"**
- ⚠️ **ADVERTENCIA:** Nunca compartas tu clave privada con nadie. Estas claves son solo para desarrollo.

**Paso 4: Importar Usuario A**
- Copia la clave privada del Usuario A:
  ```
  0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
  ```
- Pega la clave privada en el campo de texto
- Haz clic en **"Importar"** o **"Import"**
- La cuenta se agregará a tu lista de cuentas
- **Dirección esperada:** `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **Sugerencia:** Renombra esta cuenta como "Usuario A - DAO Test" para identificarla fácilmente

**Paso 5: Importar Usuario B**
- Repite los pasos 2-4 con la clave privada del Usuario B:
  ```
  0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
  ```
- **Dirección esperada:** `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- **Sugerencia:** Renombra esta cuenta como "Usuario B - DAO Test"

**Paso 6: Importar Usuario C**
- Repite los pasos 2-4 con la clave privada del Usuario C:
  ```
  0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
  ```
- **Dirección esperada:** `0x90F79bf6EB2c4f870365E785982E1f101E93b906`
- **Sugerencia:** Renombra esta cuenta como "Usuario C - DAO Test"

**Paso 7: Verificar las Cuentas**
- Deberías ver las 3 cuentas en tu lista de cuentas de MetaMask
- Cada cuenta debería mostrar **10000 ETH** (balance por defecto de Anvil)
- Puedes cambiar entre cuentas haciendo clic en el icono de cuenta y seleccionando la que quieras usar

**⚠️ Notas Importantes:**
- Estas claves privadas son **SOLO PARA DESARROLLO** - nunca las uses en mainnet
- MetaMask puede mostrar una advertencia sobre importar claves privadas - esto es normal
- Si ya tienes una cuenta con la misma dirección, MetaMask te avisará
- Puedes eliminar estas cuentas de prueba cuando termines (Configuración → Avanzado → Estado de la cuenta → Eliminar cuenta)

### 3. Configurar Red Anvil en MetaMask

#### Paso a Paso Detallado:

**Paso 1: Abrir Configuración de Redes**
- En MetaMask, haz clic en el **menú de tres líneas** (☰) en la esquina superior izquierda
- O haz clic en el **icono de red** (círculo con icono de red) junto al nombre de la red actual
- Selecciona **"Configuración"** o **"Settings"**
- En el menú lateral izquierdo, haz clic en **"Redes"** o **"Networks"**

**Paso 2: Agregar Nueva Red**
- Haz clic en el botón **"Agregar red"** o **"Add Network"** (puede estar en la parte inferior)
- O haz clic en **"Agregar red manualmente"** o **"Add a network manually"**

**Paso 3: Completar los Datos de la Red**
- Completa los siguientes campos:
  
  | Campo | Valor |
  |-------|-------|
  | **Nombre de red** | `Anvil Local` |
  | **URL de RPC** | `http://localhost:8545` |
  | **ID de cadena** | `31337` |
  | **Símbolo de moneda** | `ETH` |
  | **URL del explorador de bloques** | (dejar vacío) |

**Paso 4: Guardar la Red**
- Haz clic en **"Guardar"** o **"Save"**
- MetaMask cambiará automáticamente a la red "Anvil Local"
- Verás el icono de red cambiar y deberías ver "Anvil Local" en la parte superior

**Paso 5: Verificar la Conexión**
- Verifica que estés conectado a "Anvil Local"
- El balance debería mostrar ETH (10000 ETH por defecto en cada cuenta de Anvil)
- Si ves un error de conexión, asegúrate de que Anvil esté corriendo en `http://localhost:8545`

**⚠️ Notas Importantes:**
- Si Anvil no está corriendo, MetaMask mostrará un error al intentar conectarse
- Puedes cambiar entre redes haciendo clic en el nombre de la red en la parte superior de MetaMask
- Esta red solo funciona en tu máquina local - no está disponible en internet

### 4. Realizar Pruebas Manuales

#### Prueba 1: Verificar Balance
- Conecta con Usuario A
- Ve al frontend (http://localhost:3000)
- Verifica que el balance se muestre correctamente

#### Prueba 2: Intentar Crear Propuesta (Usuario B - debe fallar)
- Conecta con Usuario B
- Intenta crear una propuesta
- Debe fallar con el mensaje: "insufficient balance to create proposal"

#### Prueba 3: Crear Propuesta (Usuario A - debe funcionar)
- Conecta con Usuario A
- Crea una nueva propuesta
- Debe funcionar correctamente

#### Prueba 4: Votar (Gasless)
- Conecta con cualquier usuario
- Ve a la lista de propuestas
- Vota en una propuesta usando la opción "Votación sin gas"
- El relayer pagará el gas

#### Prueba 5: Cambiar Voto
- Conecta con un usuario que ya votó
- Vota de nuevo en la misma propuesta
- El voto anterior debe ser reemplazado

#### Prueba 6: Ejecutar Propuesta
- Espera a que pase el deadline de una propuesta aprobada
- El daemon ejecutará automáticamente la propuesta
- O ejecuta manualmente desde el backend

## 📊 Estado Actual del DAO

Después de ejecutar `setup-test-data.js`:

- **Propuestas:** Varía (se crea una nueva cada vez)
- **Balance total:** Varía según depósitos previos
- **Usuarios con balance:**
  - Usuario A: ~60 ETH
  - Usuario B: ~6 ETH
  - Usuario C: ~80 ETH

## 🔄 Reiniciar Datos de Prueba

Si necesitas empezar desde cero:

1. **Reinicia Anvil:**
   ```bash
   # Detén Anvil (Ctrl+C)
   anvil
   ```

2. **Redespliega los contratos:**
   ```bash
   bash scripts/deploy.sh
   ```

3. **Prepara los datos de nuevo:**
   ```bash
   cd frontend
   node ../scripts/setup-test-data.js
   ```

## 💡 Notas Importantes

- Las claves privadas son de **desarrollo solamente** - NUNCA las uses en mainnet
- Todos los usuarios tienen 10000 ETH en Anvil por defecto
- El componente de prueba integrada solo se muestra si `NEXT_PUBLIC_ENABLE_INTEGRATION_TEST=true`
- Para producción, desactiva el componente estableciendo la variable a `false` o eliminándola

## 🐛 Solución de Problemas

### Error: "Nonce too low"
- Espera unos segundos entre transacciones
- Reinicia Anvil si es necesario

### Error: "Insufficient balance"
- Verifica que el usuario tenga suficiente ETH
- En Anvil, todas las cuentas tienen 10000 ETH por defecto

### El componente de prueba no aparece
- Verifica que `NEXT_PUBLIC_ENABLE_INTEGRATION_TEST=true` en `.env.local`
- Reinicia el servidor de Next.js

