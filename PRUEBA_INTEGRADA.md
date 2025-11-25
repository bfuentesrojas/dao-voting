# Prueba Integrada del Escenario Completo

Este documento explica cómo ejecutar la prueba integrada del escenario completo desde el frontend.

## Escenario de Prueba

1. Usuario A deposita 10 ETH en el DAO
2. Usuario B deposita 1 ETH en el DAO (ajustado para que no tenga suficiente para crear propuesta)
3. Usuario A crea propuesta (tiene >10% del balance)
4. Usuario B intenta crear propuesta (falla, <10%)
5. Usuario A vota A FAVOR (gasless)
6. Usuario B vota EN CONTRA (gasless)
7. Usuario C deposita 20 ETH
8. Usuario C vota A FAVOR (gasless)
9. Esperar deadline
10. Daemon ejecuta propuesta aprobada
11. Verificar transferencia de fondos

## Método 1: Componente de Prueba en el Frontend

### Pasos:

1. **Asegúrate de que los servicios estén corriendo:**
   ```bash
   bash scripts/deploy.sh
   ```

2. **Abre el frontend en el navegador:**
   - Ve a `http://localhost:3000`
   - Conecta tu wallet (MetaMask o similar)
   - Asegúrate de estar conectado a la red Anvil (Chain ID: 31337)

3. **Ejecuta la prueba:**
   - En la página principal, verás la sección "Prueba Integrada"
   - Haz clic en el botón "Ejecutar Prueba Integrada"
   - La prueba ejecutará los pasos automáticamente
   - Verás el estado de cada paso en tiempo real

### Notas:

- La prueba requiere que tengas suficiente balance en tu wallet
- Las votaciones se realizan usando meta-transacciones (gasless)
- El componente muestra el estado de cada paso (pendiente, ejecutando, éxito, error)

## Método 2: Script de Node.js

### Pasos:

1. **Asegúrate de que Anvil esté corriendo:**
   ```bash
   anvil
   ```

2. **Asegúrate de que los contratos estén desplegados:**
   ```bash
   bash scripts/deploy.sh
   ```

3. **Ejecuta el script:**
   ```bash
   node scripts/test-integration-frontend.js
   ```

### Notas:

- El script usa las cuentas de Anvil por defecto
- Ejecuta los pasos 1-4 y 10 del escenario
- Para votaciones gasless completas, usa el componente del frontend

## Método 3: Prueba Manual Paso a Paso

### Desde el Frontend:

1. **Depositar fondos:**
   - Usa el panel "Financiar DAO"
   - Deposita 10 ETH con la cuenta A
   - Deposita 1 ETH con la cuenta B

2. **Crear propuesta:**
   - Usa el panel "Crear Propuesta"
   - Con la cuenta A (que tiene >10% del balance)
   - Intenta crear una propuesta con la cuenta B (debe fallar)

3. **Votar:**
   - Ve a la lista de propuestas
   - Haz clic en "Votar" en una propuesta
   - Selecciona el tipo de voto (A FAVOR, EN CONTRA, ABSTENCIÓN)
   - La votación se realiza sin gas (gasless)

4. **Ejecutar propuesta:**
   - Espera a que pase el deadline
   - El daemon ejecutará automáticamente las propuestas aprobadas
   - O ejecuta manualmente desde el backend

## Verificación de Resultados

### Verificar en el Frontend:

- Balance del usuario: Se muestra en el panel "Financiar DAO"
- Balance total del DAO: Se muestra en el panel "Financiar DAO"
- Propuestas: Se muestran en la lista de propuestas
- Votos: Se muestran en cada propuesta

### Verificar en la Consola del Navegador:

- Abre las herramientas de desarrollador (F12)
- Ve a la pestaña "Console"
- Verás logs de las operaciones realizadas

### Verificar en Anvil:

```bash
# Ver logs de Anvil
tail -f /tmp/anvil_dao.log
```

## Solución de Problemas

### Error: "Wallet no conectada"
- Asegúrate de conectar tu wallet en el frontend
- Verifica que estés en la red correcta (Anvil, Chain ID: 31337)

### Error: "RPC endpoint returned too many errors"
- Verifica que Anvil esté corriendo
- Espera unos segundos y recarga la página
- Reinicia Anvil si es necesario

### Error: "Insufficient balance"
- Asegúrate de tener suficiente ETH en tu wallet
- En Anvil, todas las cuentas tienen 10000 ETH por defecto

### Error: "Nonce no coincide"
- Espera unos segundos entre transacciones
- Recarga la página para sincronizar el nonce

## Comparación con el Test de Foundry

El test de Foundry (`test/FullScenario.t.sol`) ejecuta el mismo escenario pero:
- Usa Foundry VM (más rápido)
- No requiere wallet real
- Ejecuta todo automáticamente
- Ideal para desarrollo y CI/CD

La prueba integrada del frontend:
- Usa el frontend real
- Requiere wallet conectada
- Más realista (simula uso real)
- Ideal para pruebas de integración end-to-end

## Próximos Pasos

1. Ejecuta la prueba integrada desde el frontend
2. Verifica que todos los pasos se completen correctamente
3. Compara los resultados con el test de Foundry
4. Reporta cualquier problema encontrado

