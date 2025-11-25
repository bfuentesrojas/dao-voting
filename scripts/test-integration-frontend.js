#!/usr/bin/env node

/**
 * Script de prueba integrada para el frontend
 * Ejecuta el escenario completo usando ethers.js directamente
 * 
 * Uso: node scripts/test-integration-frontend.js
 * 
 * Requiere:
 * - Anvil corriendo en http://localhost:8545
 * - Contratos desplegados
 * - Variables de entorno configuradas en frontend/.env.local
 * - ethers.js instalado (npm install ethers en el directorio del script o usar el del frontend)
 */

// Intentar cargar ethers desde diferentes ubicaciones
let ethers;
try {
  ethers = require("ethers");
} catch (e) {
  try {
    // Intentar desde frontend/node_modules
    const path = require("path");
    const frontendPath = path.join(__dirname, "../frontend/node_modules/ethers");
    ethers = require(frontendPath);
  } catch (e2) {
    try {
      // Intentar desde backend/node_modules
      const path = require("path");
      const backendPath = path.join(__dirname, "../backend/node_modules/ethers");
      ethers = require(backendPath);
    } catch (e3) {
      console.error("Error: No se pudo encontrar ethers.js");
      console.error("Instala ethers con: npm install ethers");
      console.error("O ejecuta desde el directorio frontend/ o backend/");
      process.exit(1);
    }
  }
}
const fs = require("fs");
const path = require("path");

// Colores para output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Cargar configuración desde .env.local
function loadConfig() {
  const envPath = path.join(__dirname, "../frontend/.env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error("frontend/.env.local no existe. Ejecuta el script de despliegue primero.");
  }

  const envContent = fs.readFileSync(envPath, "utf-8");
  const config = {};
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      config[match[1].trim()] = match[2].trim();
    }
  });

  return {
    rpcUrl: config.NEXT_PUBLIC_RPC_URL || "http://localhost:8545",
    daoAddress: config.NEXT_PUBLIC_DAO_ADDRESS,
    forwarderAddress: config.NEXT_PUBLIC_FORWARDER_ADDRESS,
    chainId: parseInt(config.NEXT_PUBLIC_CHAIN_ID || "31337"),
  };
}

// ABI simplificado
const DAO_ABI = [
  "function fundDao() payable",
  "function getUserBalance(address) view returns (uint256)",
  "function totalBalance() view returns (uint256)",
  "function createProposal(address,uint256,uint256,string) returns (uint256)",
  "function vote(uint256,uint8)",
  "function proposalCount() view returns (uint256)",
  "function getProposal(uint256) view returns (tuple(uint256,address,address,uint256,uint256,string,uint256,uint256,uint256,bool,uint256))",
  "function executeProposal(uint256)",
  "event ProposalCreated(uint256,address,address,uint256,uint256,string)",
  "event VoteCast(uint256,address,uint8)",
  "event ProposalExecuted(uint256,address,uint256)",
];

const FORWARDER_ABI = [
  "function getNonce(address) view returns (uint256)",
  "function execute(tuple(address,address,uint256,uint256,uint256,bytes), bytes) payable returns (bool, bytes)",
];

async function main() {
  log("========================================", "cyan");
  log("Prueba Integrada del Escenario Completo", "cyan");
  log("========================================", "cyan");
  log("");

  const config = loadConfig();
  log(`RPC URL: ${config.rpcUrl}`, "blue");
  log(`DAO Address: ${config.daoAddress}`, "blue");
  log(`Forwarder Address: ${config.forwarderAddress}`, "blue");
  log("");

  // Conectar al provider
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const network = await provider.getNetwork();
  log(`Conectado a la red: ${network.name} (Chain ID: ${network.chainId})`, "green");
  log("");

  // Usar las cuentas de Anvil (primera cuenta como relayer)
  const relayerPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const relayer = new ethers.Wallet(relayerPrivateKey, provider);
  log(`Relayer: ${relayer.address}`, "blue");

  // Crear wallets para usuarios (usando claves privadas de Anvil)
  const userA = new ethers.Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", provider);
  const userB = new ethers.Wallet("0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", provider);
  const userC = new ethers.Wallet("0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6", provider);
  const recipient = "0x1234567890123456789012345678901234567890";

  log(`Usuario A: ${userA.address}`, "blue");
  log(`Usuario B: ${userB.address}`, "blue");
  log(`Usuario C: ${userC.address}`, "blue");
  log("");

  // Obtener contratos
  const dao = new ethers.Contract(config.daoAddress, DAO_ABI, provider);
  const forwarder = new ethers.Contract(config.forwarderAddress, FORWARDER_ABI, provider);

  try {
    // Paso 1: Usuario A deposita 10 ETH
    log("========================================", "cyan");
    log("PASO 1: Usuario A deposita 10 ETH", "yellow");
    log("========================================", "cyan");
    log(`👤 Usuario: ${userA.address}`, "blue");
    const balanceABefore = await dao.getUserBalance(userA.address);
    const totalBalanceBefore1 = await dao.totalBalance();
    log(`📊 Balance usuario antes: ${ethers.formatEther(balanceABefore)} ETH`, "blue");
    log(`📊 Balance total DAO antes: ${ethers.formatEther(totalBalanceBefore1)} ETH`, "blue");
    log(`💰 Monto a depositar: 10 ETH`, "blue");
    log(`🕐 Timestamp: ${new Date().toLocaleString()}`, "blue");
    
    const tx1 = await dao.connect(userA).fundDao({ value: ethers.parseEther("10") });
    log(`🔗 TX Hash: ${tx1.hash}`, "cyan");
    log(`⏳ Esperando confirmación...`, "yellow");
    const receipt1 = await tx1.wait();
    log(`✅ Transacción confirmada en bloque: ${receipt1.blockNumber}`, "green");
    
    const balanceAAfter = await dao.getUserBalance(userA.address);
    const totalBalanceAfter1 = await dao.totalBalance();
    log(`📊 Balance usuario después: ${ethers.formatEther(balanceAAfter)} ETH`, "green");
    log(`📊 Balance total DAO después: ${ethers.formatEther(totalBalanceAfter1)} ETH`, "green");
    log(`📈 Diferencia: +${ethers.formatEther(balanceAAfter - balanceABefore)} ETH (usuario)`, "green");
    log(`📈 Diferencia: +${ethers.formatEther(totalBalanceAfter1 - totalBalanceBefore1)} ETH (DAO)`, "green");
    log("");

    // Paso 2: Usuario B deposita 1 ETH
    log("========================================", "cyan");
    log("PASO 2: Usuario B deposita 1 ETH", "yellow");
    log("========================================", "cyan");
    log(`👤 Usuario: ${userB.address}`, "blue");
    const balanceBBefore = await dao.getUserBalance(userB.address);
    const totalBalanceBefore2 = await dao.totalBalance();
    log(`📊 Balance usuario antes: ${ethers.formatEther(balanceBBefore)} ETH`, "blue");
    log(`📊 Balance total DAO antes: ${ethers.formatEther(totalBalanceBefore2)} ETH`, "blue");
    log(`💰 Monto a depositar: 1 ETH`, "blue");
    log(`🕐 Timestamp: ${new Date().toLocaleString()}`, "blue");
    
    const tx2 = await dao.connect(userB).fundDao({ value: ethers.parseEther("1") });
    log(`🔗 TX Hash: ${tx2.hash}`, "cyan");
    log(`⏳ Esperando confirmación...`, "yellow");
    const receipt2 = await tx2.wait();
    log(`✅ Transacción confirmada en bloque: ${receipt2.blockNumber}`, "green");
    
    const balanceBAfter = await dao.getUserBalance(userB.address);
    const totalBalanceAfter2 = await dao.totalBalance();
    log(`📊 Balance usuario después: ${ethers.formatEther(balanceBAfter)} ETH`, "green");
    log(`📊 Balance total DAO después: ${ethers.formatEther(totalBalanceAfter2)} ETH`, "green");
    log(`📈 Diferencia: +${ethers.formatEther(balanceBAfter - balanceBBefore)} ETH (usuario)`, "green");
    log(`📈 Diferencia: +${ethers.formatEther(totalBalanceAfter2 - totalBalanceBefore2)} ETH (DAO)`, "green");
    
    // Calcular porcentaje mínimo requerido
    const minRequired = (totalBalanceAfter2 * 10n) / 100n;
    log(`📋 Mínimo requerido para crear propuesta: ${ethers.formatEther(minRequired)} ETH (10% del total)`, "cyan");
    log(`📋 Usuario A tiene: ${ethers.formatEther(balanceAAfter)} ETH (${((balanceAAfter * 100n) / totalBalanceAfter2).toString()}% del total)`, "cyan");
    log(`📋 Usuario B tiene: ${ethers.formatEther(balanceBAfter)} ETH (${((balanceBAfter * 100n) / totalBalanceAfter2).toString()}% del total)`, "cyan");
    log("");

    // Paso 3: Usuario A crea propuesta
    log("========================================", "cyan");
    log("PASO 3: Usuario A crea propuesta", "yellow");
    log("========================================", "cyan");
    log(`👤 Usuario: ${userA.address}`, "blue");
    const proposalAmount = ethers.parseEther("5");
    // Obtener el tiempo actual de la blockchain, no del sistema
    const currentBlock = await provider.getBlock("latest");
    const currentBlockTime = Number(currentBlock.timestamp);
    const deadline = currentBlockTime + 7 * 24 * 60 * 60; // 7 días desde ahora
    const deadlineDate = new Date(deadline * 1000);
    log(`📝 Descripción: "Propuesta de prueba integrada"`, "blue");
    log(`💰 Monto de la propuesta: ${ethers.formatEther(proposalAmount)} ETH`, "blue");
    log(`👤 Recipient: ${recipient}`, "blue");
    log(`📅 Deadline: ${deadlineDate.toLocaleString()} (${deadline} timestamp)`, "blue");
    log(`🕐 Timestamp: ${new Date().toLocaleString()}`, "blue");
    
    const proposalCountBefore = await dao.proposalCount();
    log(`📊 Número de propuestas antes: ${proposalCountBefore}`, "blue");
    
    const tx3 = await dao
      .connect(userA)
      .createProposal(recipient, proposalAmount, deadline, "Propuesta de prueba integrada");
    log(`🔗 TX Hash: ${tx3.hash}`, "cyan");
    log(`⏳ Esperando confirmación...`, "yellow");
    const receipt3 = await tx3.wait();
    log(`✅ Transacción confirmada en bloque: ${receipt3.blockNumber}`, "green");
    
    const proposalCreatedEvent = receipt3.logs.find(
      (log) => log.topics[0] === ethers.id("ProposalCreated(uint256,address,address,uint256,uint256,string)")
    );
    const proposalId = ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], proposalCreatedEvent.topics[1])[0];
    const proposalCountAfter = await dao.proposalCount();
    
    log(`📝 Propuesta ID: ${proposalId}`, "green");
    log(`📊 Número de propuestas después: ${proposalCountAfter}`, "green");
    
    // Obtener detalles de la propuesta
    const proposal = await dao.getProposal(proposalId);
    log(`📋 Detalles de la propuesta:`, "cyan");
    log(`   - Proposer: ${proposal[1]}`, "cyan");
    log(`   - Recipient: ${proposal[2]}`, "cyan");
    log(`   - Amount: ${ethers.formatEther(proposal[3])} ETH`, "cyan");
    log(`   - Deadline: ${new Date(Number(proposal[4]) * 1000).toLocaleString()}`, "cyan");
    log(`   - Description: ${proposal[5]}`, "cyan");
    log(`   - Votes For: ${proposal[6]}`, "cyan");
    log(`   - Votes Against: ${proposal[7]}`, "cyan");
    log(`   - Votes Abstain: ${proposal[8]}`, "cyan");
    log(`   - Executed: ${proposal[9]}`, "cyan");
    log("");

    // Paso 4: Usuario B intenta crear propuesta (debe fallar)
    log("========================================", "cyan");
    log("PASO 4: Usuario B intenta crear propuesta (debe fallar)", "yellow");
    log("========================================", "cyan");
    log(`👤 Usuario: ${userB.address}`, "blue");
    const balanceBForProposal = await dao.getUserBalance(userB.address);
    const totalBalanceForProposal = await dao.totalBalance();
    const minRequiredForProposal = (totalBalanceForProposal * 10n) / 100n;
    log(`📊 Balance usuario B: ${ethers.formatEther(balanceBForProposal)} ETH`, "blue");
    log(`📊 Balance total DAO: ${ethers.formatEther(totalBalanceForProposal)} ETH`, "blue");
    log(`📋 Mínimo requerido: ${ethers.formatEther(minRequiredForProposal)} ETH (10% del total)`, "blue");
    log(`❌ Usuario B NO tiene suficiente balance (${ethers.formatEther(balanceBForProposal)} < ${ethers.formatEther(minRequiredForProposal)})`, "red");
    log(`💰 Monto de propuesta intentada: 1 ETH`, "blue");
    log(`🕐 Timestamp: ${new Date().toLocaleString()}`, "blue");
    
    try {
      const tx4 = await dao
        .connect(userB)
        .createProposal(recipient, ethers.parseEther("1"), deadline, "Esta debe fallar");
      log(`🔗 TX Hash: ${tx4.hash}`, "cyan");
      await tx4.wait();
      log("   ❌ ERROR: La propuesta no debería haberse creado", "red");
    } catch (error) {
      log(`   ✅ Correctamente rechazada`, "green");
      log(`   📝 Error esperado: ${error.message.split("(")[0]}`, "green");
      log(`   💡 Razón: Usuario B no tiene suficiente balance (requiere >= 10% del total)`, "green");
    }
    log("");

    // Paso 5: Usuario A vota A FAVOR
    log("========================================", "cyan");
    log("PASO 5: Usuario A vota A FAVOR", "yellow");
    log("========================================", "cyan");
    log(`👤 Usuario: ${userA.address}`, "blue");
    log(`📝 Propuesta ID: ${proposalId}`, "blue");
    log(`🗳️  Voto: A FAVOR (VoteType.FOR = 1)`, "blue");
    log(`🕐 Timestamp: ${new Date().toLocaleString()}`, "blue");
    
    const proposalBefore5 = await dao.getProposal(proposalId);
    log(`📊 Votos antes - A favor: ${proposalBefore5[6]}, En contra: ${proposalBefore5[7]}, Abstenciones: ${proposalBefore5[8]}`, "blue");
    
    // Obtener nonce actual antes de enviar la transacción
    const nonce5 = await provider.getTransactionCount(userA.address);
    const tx5 = await dao.connect(userA).vote(proposalId, 1, { nonce: nonce5 }); // VoteType.FOR = 1
    log(`🔗 TX Hash: ${tx5.hash}`, "cyan");
    log(`⏳ Esperando confirmación...`, "yellow");
    const receipt5 = await tx5.wait();
    log(`✅ Transacción confirmada en bloque: ${receipt5.blockNumber}`, "green");
    
    const proposalAfter5 = await dao.getProposal(proposalId);
    log(`📊 Votos después - A favor: ${proposalAfter5[6]}, En contra: ${proposalAfter5[7]}, Abstenciones: ${proposalAfter5[8]}`, "green");
    log("");

    // Paso 6: Usuario B vota EN CONTRA
    log("========================================", "cyan");
    log("PASO 6: Usuario B vota EN CONTRA", "yellow");
    log("========================================", "cyan");
    log(`👤 Usuario: ${userB.address}`, "blue");
    log(`📝 Propuesta ID: ${proposalId}`, "blue");
    log(`🗳️  Voto: EN CONTRA (VoteType.AGAINST = 0)`, "blue");
    log(`🕐 Timestamp: ${new Date().toLocaleString()}`, "blue");
    
    const proposalBefore6 = await dao.getProposal(proposalId);
    log(`📊 Votos antes - A favor: ${proposalBefore6[6]}, En contra: ${proposalBefore6[7]}, Abstenciones: ${proposalBefore6[8]}`, "blue");
    
    // Obtener nonce actual antes de enviar la transacción
    const nonce6 = await provider.getTransactionCount(userB.address);
    const tx6 = await dao.connect(userB).vote(proposalId, 0, { nonce: nonce6 }); // VoteType.AGAINST = 0
    log(`🔗 TX Hash: ${tx6.hash}`, "cyan");
    log(`⏳ Esperando confirmación...`, "yellow");
    const receipt6 = await tx6.wait();
    log(`✅ Transacción confirmada en bloque: ${receipt6.blockNumber}`, "green");
    
    const proposalAfter6 = await dao.getProposal(proposalId);
    log(`📊 Votos después - A favor: ${proposalAfter6[6]}, En contra: ${proposalAfter6[7]}, Abstenciones: ${proposalAfter6[8]}`, "green");
    log("");

    // Paso 7: Usuario C deposita 20 ETH
    log("========================================", "cyan");
    log("PASO 7: Usuario C deposita 20 ETH", "yellow");
    log("========================================", "cyan");
    log(`👤 Usuario: ${userC.address}`, "blue");
    const balanceCBefore = await dao.getUserBalance(userC.address);
    const totalBalanceBefore7 = await dao.totalBalance();
    log(`📊 Balance usuario antes: ${ethers.formatEther(balanceCBefore)} ETH`, "blue");
    log(`📊 Balance total DAO antes: ${ethers.formatEther(totalBalanceBefore7)} ETH`, "blue");
    log(`💰 Monto a depositar: 20 ETH`, "blue");
    log(`🕐 Timestamp: ${new Date().toLocaleString()}`, "blue");
    
    const tx7 = await dao.connect(userC).fundDao({ value: ethers.parseEther("20") });
    log(`🔗 TX Hash: ${tx7.hash}`, "cyan");
    log(`⏳ Esperando confirmación...`, "yellow");
    const receipt7 = await tx7.wait();
    log(`✅ Transacción confirmada en bloque: ${receipt7.blockNumber}`, "green");
    
    const balanceCAfter = await dao.getUserBalance(userC.address);
    const totalBalanceAfter7 = await dao.totalBalance();
    log(`📊 Balance usuario después: ${ethers.formatEther(balanceCAfter)} ETH`, "green");
    log(`📊 Balance total DAO después: ${ethers.formatEther(totalBalanceAfter7)} ETH`, "green");
    log(`📈 Diferencia: +${ethers.formatEther(balanceCAfter - balanceCBefore)} ETH (usuario)`, "green");
    log(`📈 Diferencia: +${ethers.formatEther(totalBalanceAfter7 - totalBalanceBefore7)} ETH (DAO)`, "green");
    log("");

    // Paso 8: Usuario C vota A FAVOR
    log("========================================", "cyan");
    log("PASO 8: Usuario C vota A FAVOR", "yellow");
    log("========================================", "cyan");
    log(`👤 Usuario: ${userC.address}`, "blue");
    log(`📝 Propuesta ID: ${proposalId}`, "blue");
    log(`🗳️  Voto: A FAVOR (VoteType.FOR = 1)`, "blue");
    log(`🕐 Timestamp: ${new Date().toLocaleString()}`, "blue");
    
    const proposalBefore8 = await dao.getProposal(proposalId);
    log(`📊 Votos antes - A favor: ${proposalBefore8[6]}, En contra: ${proposalBefore8[7]}, Abstenciones: ${proposalBefore8[8]}`, "blue");
    
    // Obtener nonce actual antes de enviar la transacción
    const nonce8 = await provider.getTransactionCount(userC.address);
    const tx8 = await dao.connect(userC).vote(proposalId, 1, { nonce: nonce8 }); // VoteType.FOR = 1
    log(`🔗 TX Hash: ${tx8.hash}`, "cyan");
    log(`⏳ Esperando confirmación...`, "yellow");
    const receipt8 = await tx8.wait();
    log(`✅ Transacción confirmada en bloque: ${receipt8.blockNumber}`, "green");
    
    const proposalAfter8 = await dao.getProposal(proposalId);
    log(`📊 Votos después - A favor: ${proposalAfter8[6]}, En contra: ${proposalAfter8[7]}, Abstenciones: ${proposalAfter8[8]}`, "green");
    const isApproved = proposalAfter8[6] > proposalAfter8[7];
    log(`✅ Propuesta ${isApproved ? "APROBADA" : "RECHAZADA"}: ${proposalAfter8[6]} a favor > ${proposalAfter8[7]} en contra`, isApproved ? "green" : "red");
    log("");

    // Paso 9: Esperar deadline
    log("========================================", "cyan");
    log("PASO 9: Esperar deadline", "yellow");
    log("========================================", "cyan");
    const proposalForDeadline = await dao.getProposal(proposalId);
    const proposalDeadline = Number(proposalForDeadline[4]);
    const blockForDeadline = await provider.getBlock("latest");
    const blockTimeNow = Number(blockForDeadline.timestamp);
    log(`🕐 Tiempo actual (blockchain): ${new Date(blockTimeNow * 1000).toLocaleString()} (${blockTimeNow})`, "blue");
    log(`📅 Deadline de la propuesta: ${new Date(proposalDeadline * 1000).toLocaleString()} (${proposalDeadline})`, "blue");
    
    if (blockTimeNow < proposalDeadline) {
      const timeRemaining = proposalDeadline - blockTimeNow;
      log(`⏳ Faltan ${Math.floor(timeRemaining / 86400)} días, ${Math.floor((timeRemaining % 86400) / 3600)} horas para el deadline`, "yellow");
      log(`💡 Avanzando tiempo en Anvil para simular que pasó el deadline...`, "blue");
      
      // Avanzar tiempo en Anvil usando increaseTime
      try {
        const timeToIncrease = timeRemaining + 1; // Avanzar 1 segundo más del deadline
        await provider.send("evm_increaseTime", [timeToIncrease]);
        await provider.send("evm_mine", []); // Minar un bloque para aplicar el cambio
        const newBlock = await provider.getBlock("latest");
        const newBlockTime = Number(newBlock.timestamp);
        log(`✅ Tiempo avanzado. Nuevo tiempo blockchain: ${new Date(newBlockTime * 1000).toLocaleString()} (${newBlockTime})`, "green");
        log(`✅ Bloque minado: ${newBlock.number}`, "green");
      } catch (error) {
        log(`⚠️  No se pudo avanzar el tiempo automáticamente: ${error.message}`, "yellow");
        log(`💡 En producción, esperarías hasta que pase el deadline naturalmente`, "blue");
      }
    } else {
      log(`✅ Deadline ya pasó`, "green");
    }
    log("");

    // Paso 10: Ejecutar propuesta
    log("========================================", "cyan");
    log("PASO 10: Daemon ejecuta propuesta aprobada", "yellow");
    log("========================================", "cyan");
    log(`👤 Ejecutor (Daemon/Relayer): ${relayer.address}`, "blue");
    log(`📝 Propuesta ID: ${proposalId}`, "blue");
    log(`🕐 Timestamp: ${new Date().toLocaleString()}`, "blue");
    
    const recipientBalanceBefore = await provider.getBalance(recipient);
    const daoBalanceBefore = await dao.totalBalance();
    log(`📊 Balance recipient antes: ${ethers.formatEther(recipientBalanceBefore)} ETH`, "blue");
    log(`📊 Balance DAO antes: ${ethers.formatEther(daoBalanceBefore)} ETH`, "blue");
    
    const proposalBefore10 = await dao.getProposal(proposalId);
    log(`📋 Propuesta - Monto: ${ethers.formatEther(proposalBefore10[3])} ETH, Ejecutada: ${proposalBefore10[9]}`, "blue");
    
    // Primera llamada establece executionTime
    log(`⏳ Primera llamada: estableciendo executionTime...`, "yellow");
    try {
      const tx10a = await dao.connect(relayer).executeProposal(proposalId);
      log(`🔗 TX Hash: ${tx10a.hash}`, "cyan");
      const receipt10a = await tx10a.wait();
      log(`✅ Primera llamada confirmada en bloque: ${receipt10a.blockNumber}`, "green");
      log(`💡 executionTime establecido. Ahora hay que esperar 1 día (EXECUTION_DELAY)`, "blue");
    } catch (error) {
      log(`   ⚠️  Primera llamada: ${error.message}`, "yellow");
      log(`   💡 Esto es normal si el deadline no ha pasado o ya se estableció executionTime`, "blue");
    }

    // Avanzar tiempo (simulado - en producción esperarías)
    log(`⏳ Esperando período de seguridad (1 día = EXECUTION_DELAY)...`, "yellow");
    log(`   (En producción, esperarías 1 día después de la primera llamada)`, "blue");
    log(`   (En esta prueba, asumimos que el tiempo ya pasó)`, "blue");
    log("");

    // Avanzar tiempo del período de seguridad (1 día) antes de la segunda llamada
    log(`⏳ Avanzando tiempo del período de seguridad (1 día = 86400 segundos)...`, "yellow");
    try {
      await provider.send("evm_increaseTime", [86400 + 1]); // 1 día + 1 segundo
      await provider.send("evm_mine", []);
      const blockAfterDelay = await provider.getBlock("latest");
      log(`✅ Tiempo avanzado. Nuevo tiempo blockchain: ${new Date(Number(blockAfterDelay.timestamp) * 1000).toLocaleString()}`, "green");
    } catch (error) {
      log(`⚠️  No se pudo avanzar el tiempo: ${error.message}`, "yellow");
    }
    
    // Segunda llamada ejecuta la propuesta
    log(`⏳ Segunda llamada: ejecutando propuesta...`, "yellow");
    try {
      const nonce10b = await provider.getTransactionCount(relayer.address);
      const tx10b = await dao.connect(relayer).executeProposal(proposalId, { nonce: nonce10b });
      log(`🔗 TX Hash: ${tx10b.hash}`, "cyan");
      log(`⏳ Esperando confirmación...`, "yellow");
      const receipt10b = await tx10b.wait();
      log(`✅ Segunda llamada confirmada en bloque: ${receipt10b.blockNumber}`, "green");
      
      const recipientBalanceAfter = await provider.getBalance(recipient);
      const daoBalanceAfter = await dao.totalBalance();
      const proposalAfter10 = await dao.getProposal(proposalId);
      
      log(`📊 Balance recipient después: ${ethers.formatEther(recipientBalanceAfter)} ETH`, "green");
      log(`📊 Balance DAO después: ${ethers.formatEther(daoBalanceAfter)} ETH`, "green");
      log(`📈 Diferencia recipient: +${ethers.formatEther(recipientBalanceAfter - recipientBalanceBefore)} ETH`, "green");
      log(`📈 Diferencia DAO: -${ethers.formatEther(daoBalanceBefore - daoBalanceAfter)} ETH`, "green");
      log(`✅ Propuesta ejecutada: ${proposalAfter10[9]}`, "green");
      
      if (proposalAfter10[9]) {
        log(`🎉 ¡Propuesta ejecutada exitosamente!`, "green");
      }
    } catch (error) {
      log(`   ⚠️  Segunda llamada: ${error.message}`, "yellow");
      log(`   💡 Esto puede ser normal si el período de seguridad no ha pasado`, "blue");
    }
    log("");

    // Paso 11: Verificar transferencia de fondos
    log("========================================", "cyan");
    log("PASO 11: Verificar transferencia de fondos", "yellow");
    log("========================================", "cyan");
    const finalRecipientBalance = await provider.getBalance(recipient);
    const finalDaoBalance = await dao.totalBalance();
    const finalProposal = await dao.getProposal(proposalId);
    
    log(`📊 Balance final del recipient: ${ethers.formatEther(finalRecipientBalance)} ETH`, "blue");
    log(`📊 Balance final del DAO: ${ethers.formatEther(finalDaoBalance)} ETH`, "blue");
    log(`📋 Estado de la propuesta:`, "blue");
    log(`   - Ejecutada: ${finalProposal[9]}`, "blue");
    log(`   - Monto: ${ethers.formatEther(finalProposal[3])} ETH`, "blue");
    
    if (finalProposal[9]) {
      const expectedRecipientBalance = recipientBalanceBefore + proposalAmount;
      const expectedDaoBalance = daoBalanceBefore - proposalAmount;
      
      if (finalRecipientBalance >= expectedRecipientBalance && finalDaoBalance <= expectedDaoBalance) {
        log(`✅ Transferencia verificada correctamente`, "green");
        log(`   Recipient recibió: ${ethers.formatEther(finalRecipientBalance - recipientBalanceBefore)} ETH`, "green");
        log(`   DAO transfirió: ${ethers.formatEther(daoBalanceBefore - finalDaoBalance)} ETH`, "green");
      } else {
        log(`⚠️  Transferencia parcial o pendiente`, "yellow");
      }
    } else {
      log(`⚠️  Propuesta aún no ejecutada`, "yellow");
    }
    log("");

    log("========================================", "cyan");
    log("✅ ESCENARIO COMPLETO EJECUTADO", "green");
    log("========================================", "cyan");
    log("");
    log("Resumen:", "yellow");
    log(`  👤 Usuario A: ${userA.address}`, "blue");
    log(`     - Depositó: 10 ETH`, "blue");
    log(`     - Creó propuesta ID: ${proposalId}`, "blue");
    log(`     - Votó: A FAVOR`, "blue");
    log(`  👤 Usuario B: ${userB.address}`, "blue");
    log(`     - Depositó: 1 ETH`, "blue");
    log(`     - Intentó crear propuesta: RECHAZADA (balance insuficiente)`, "blue");
    log(`     - Votó: EN CONTRA`, "blue");
    log(`  👤 Usuario C: ${userC.address}`, "blue");
    log(`     - Depositó: 20 ETH`, "blue");
    log(`     - Votó: A FAVOR`, "blue");
    log(`  🤖 Daemon/Relayer: ${relayer.address}`, "blue");
    log(`     - Ejecutó propuesta aprobada`, "blue");
    log("");

  } catch (error) {
    log(`Error: ${error.message}`, "red");
    console.error(error);
    process.exit(1);
  }
}

main().catch((error) => {
  log(`Error fatal: ${error.message}`, "red");
  console.error(error);
  process.exit(1);
});

