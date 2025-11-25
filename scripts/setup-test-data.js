#!/usr/bin/env node

/**
 * Script para preparar datos de prueba en el DAO
 * Crea depósitos, propuestas y votos para pruebas manuales
 * 
 * Uso: node scripts/setup-test-data.js
 * 
 * Requiere:
 * - Anvil corriendo en http://localhost:8545
 * - Contratos desplegados
 * - Variables de entorno configuradas en frontend/.env.local
 */

// Intentar cargar ethers desde diferentes ubicaciones
let ethers;
try {
  ethers = require("ethers");
} catch (e) {
  try {
    const path = require("path");
    const frontendPath = path.join(__dirname, "../frontend/node_modules/ethers");
    ethers = require(frontendPath);
  } catch (e2) {
    try {
      const path = require("path");
      const backendPath = path.join(__dirname, "../backend/node_modules/ethers");
      ethers = require(backendPath);
    } catch (e3) {
      console.error("Error: No se pudo encontrar ethers.js");
      console.error("Instala ethers con: npm install ethers");
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
];

async function main() {
  log("========================================", "cyan");
  log("Preparando Datos de Prueba para el DAO", "cyan");
  log("========================================", "cyan");
  log("");

  const config = loadConfig();
  log(`RPC URL: ${config.rpcUrl}`, "blue");
  log(`DAO Address: ${config.daoAddress}`, "blue");
  log("");

  // Conectar al provider
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const network = await provider.getNetwork();
  log(`Conectado a la red: ${network.name} (Chain ID: ${network.chainId})`, "green");
  log("");

  // Usar las cuentas de Anvil
  const userA = new ethers.Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", provider);
  const userB = new ethers.Wallet("0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", provider);
  const userC = new ethers.Wallet("0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6", provider);
  const recipient = "0x1234567890123456789012345678901234567890";

  log(`👤 Usuario A: ${userA.address}`, "blue");
  log(`👤 Usuario B: ${userB.address}`, "blue");
  log(`👤 Usuario C: ${userC.address}`, "blue");
  log(`👤 Recipient: ${recipient}`, "blue");
  log("");

  // Obtener contrato
  const dao = new ethers.Contract(config.daoAddress, DAO_ABI, provider);

  try {
    // Verificar estado actual
    const currentProposalCount = await dao.proposalCount();
    const totalBalance = await dao.totalBalance();
    log(`📊 Estado actual:`, "cyan");
    log(`   - Propuestas existentes: ${currentProposalCount}`, "cyan");
    log(`   - Balance total DAO: ${ethers.formatEther(totalBalance)} ETH`, "cyan");
    log("");

    // Paso 1: Usuario A deposita 10 ETH
    log("1. Usuario A deposita 10 ETH", "yellow");
    const balanceABefore = await dao.getUserBalance(userA.address);
    if (balanceABefore < ethers.parseEther("10")) {
      const tx1 = await dao.connect(userA).fundDao({ value: ethers.parseEther("10") });
      await tx1.wait();
      log(`   ✅ Depositado. TX: ${tx1.hash}`, "green");
    } else {
      log(`   ⏭️  Ya tiene suficiente balance: ${ethers.formatEther(balanceABefore)} ETH`, "blue");
    }
    log("");

    // Paso 2: Usuario B deposita 1 ETH
    log("2. Usuario B deposita 1 ETH", "yellow");
    const balanceBBefore = await dao.getUserBalance(userB.address);
    if (balanceBBefore < ethers.parseEther("1")) {
      const tx2 = await dao.connect(userB).fundDao({ value: ethers.parseEther("1") });
      await tx2.wait();
      log(`   ✅ Depositado. TX: ${tx2.hash}`, "green");
    } else {
      log(`   ⏭️  Ya tiene suficiente balance: ${ethers.formatEther(balanceBBefore)} ETH`, "blue");
    }
    log("");

    // Paso 3: Usuario C deposita 20 ETH
    log("3. Usuario C deposita 20 ETH", "yellow");
    const balanceCBefore = await dao.getUserBalance(userC.address);
    if (balanceCBefore < ethers.parseEther("20")) {
      const tx3 = await dao.connect(userC).fundDao({ value: ethers.parseEther("20") });
      await tx3.wait();
      log(`   ✅ Depositado. TX: ${tx3.hash}`, "green");
    } else {
      log(`   ⏭️  Ya tiene suficiente balance: ${ethers.formatEther(balanceCBefore)} ETH`, "blue");
    }
    log("");

    // Paso 4: Usuario A crea propuesta
    log("4. Usuario A crea propuesta de prueba", "yellow");
    const currentBlock = await provider.getBlock("latest");
    const deadline = Number(currentBlock.timestamp) + 7 * 24 * 60 * 60; // 7 días
    
    const tx4 = await dao
      .connect(userA)
      .createProposal(
        recipient,
        ethers.parseEther("5"),
        deadline,
        "Propuesta de prueba manual - Transferir 5 ETH al recipient"
      );
    const receipt4 = await tx4.wait();
    const proposalCreatedEvent = receipt4.logs.find(
      (log) => log.topics[0] === ethers.id("ProposalCreated(uint256,address,address,uint256,uint256,string)")
    );
    const proposalId = ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], proposalCreatedEvent.topics[1])[0];
    log(`   ✅ Propuesta creada. ID: ${proposalId}`, "green");
    log(`   📝 TX: ${tx4.hash}`, "cyan");
    log("");

    // Paso 5: Usuario A vota A FAVOR
    log("5. Usuario A vota A FAVOR", "yellow");
    // Esperar un poco para que el nonce se actualice
    await new Promise(resolve => setTimeout(resolve, 500));
    const tx5 = await dao.connect(userA).vote(proposalId, 1); // VoteType.FOR = 1
    const receipt5 = await tx5.wait();
    log(`   ✅ Voto registrado. TX: ${tx5.hash}`, "green");
    log(`   📊 Bloque: ${receipt5.blockNumber}`, "cyan");
    log("");

    // Paso 6: Usuario B vota EN CONTRA
    log("6. Usuario B vota EN CONTRA", "yellow");
    await new Promise(resolve => setTimeout(resolve, 500));
    const tx6 = await dao.connect(userB).vote(proposalId, 0); // VoteType.AGAINST = 0
    const receipt6 = await tx6.wait();
    log(`   ✅ Voto registrado. TX: ${tx6.hash}`, "green");
    log(`   📊 Bloque: ${receipt6.blockNumber}`, "cyan");
    log("");

    // Paso 7: Usuario C vota A FAVOR
    log("7. Usuario C vota A FAVOR", "yellow");
    await new Promise(resolve => setTimeout(resolve, 500));
    const tx7 = await dao.connect(userC).vote(proposalId, 1); // VoteType.FOR = 1
    const receipt7 = await tx7.wait();
    log(`   ✅ Voto registrado. TX: ${tx7.hash}`, "green");
    log(`   📊 Bloque: ${receipt7.blockNumber}`, "cyan");
    log("");

    // Mostrar resumen final
    const finalProposal = await dao.getProposal(proposalId);
    const finalBalanceA = await dao.getUserBalance(userA.address);
    const finalBalanceB = await dao.getUserBalance(userB.address);
    const finalBalanceC = await dao.getUserBalance(userC.address);
    const finalTotalBalance = await dao.totalBalance();

    log("========================================", "cyan");
    log("✅ Datos de Prueba Preparados", "green");
    log("========================================", "cyan");
    log("");
    log("📋 Resumen de Datos:", "yellow");
    log(`   Propuesta ID: ${proposalId}`, "blue");
    log(`   - Proposer: ${finalProposal[1]}`, "blue");
    log(`   - Monto: ${ethers.formatEther(finalProposal[3])} ETH`, "blue");
    log(`   - Deadline: ${new Date(Number(finalProposal[4]) * 1000).toLocaleString()}`, "blue");
    log(`   - Votos a favor: ${finalProposal[6]}`, "blue");
    log(`   - Votos en contra: ${finalProposal[7]}`, "blue");
    log(`   - Votos abstenciones: ${finalProposal[8]}`, "blue");
    log(`   - Estado: ${finalProposal[6] > finalProposal[7] ? "APROBADA" : "RECHAZADA"}`, "blue");
    log("");
    log("💰 Balances de Usuarios:", "yellow");
    log(`   Usuario A: ${ethers.formatEther(finalBalanceA)} ETH`, "blue");
    log(`   Usuario B: ${ethers.formatEther(finalBalanceB)} ETH`, "blue");
    log(`   Usuario C: ${ethers.formatEther(finalBalanceC)} ETH`, "blue");
    log(`   Balance total DAO: ${ethers.formatEther(finalTotalBalance)} ETH`, "blue");
    log("");
    log("🔑 Claves Privadas para Pruebas Manuales:", "yellow");
    log(`   Usuario A: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`, "cyan");
    log(`   Usuario B: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`, "cyan");
    log(`   Usuario C: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6`, "cyan");
    log("");
    log("💡 Para pruebas manuales:", "yellow");
    log("   1. Importa estas claves privadas en MetaMask", "blue");
    log("   2. Conecta a la red Anvil (Chain ID: 31337)", "blue");
    log("   3. Usa el frontend para interactuar con la propuesta", "blue");
    log("");

  } catch (error) {
    log(`❌ Error: ${error.message}`, "red");
    console.error(error);
    process.exit(1);
  }
}

main().catch((error) => {
  log(`❌ Error fatal: ${error.message}`, "red");
  console.error(error);
  process.exit(1);
});

