import { ethers } from "ethers";
import { getDAOContract } from "./contracts";
import dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.RPC_URL || "http://localhost:8545";
const DAO_ADDRESS = process.env.DAO_CONTRACT_ADDRESS || "";
const PRIVATE_KEY = process.env.DAEMON_PRIVATE_KEY || "";
const INTERVAL_SECONDS = parseInt(process.env.DAEMON_INTERVAL || "60");

if (!DAO_ADDRESS || !PRIVATE_KEY) {
  console.error("Error: DAO_ADDRESS y DAEMON_PRIVATE_KEY deben estar configurados");
  process.exit(1);
}

async function executeEligibleProposals() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const dao = getDAOContract(wallet, DAO_ADDRESS);

    // Obtener número de propuestas
    const proposalCount = await dao.proposalCount();
    const now = Math.floor(Date.now() / 1000);

    console.log(`[${new Date().toISOString()}] Verificando ${proposalCount} propuestas...`);

    for (let i = 1; i <= Number(proposalCount); i++) {
      try {
        const proposal = await dao.getProposal(BigInt(i));

        // Verificar si la propuesta es elegible para ejecución
        const deadline = Number(proposal.deadline);
        const isDeadlinePassed = deadline < now;
        const isApproved = proposal.votesFor > proposal.votesAgainst;
        const isNotExecuted = !proposal.executed;

        if (isDeadlinePassed && isApproved && isNotExecuted) {
          // Verificar si necesita esperar el período de seguridad
          const executionTime = Number(proposal.executionTime);
          const executionDelay = Number(await dao.EXECUTION_DELAY());

          if (executionTime === 0) {
            // Primera llamada: establecer executionTime
            console.log(`[${new Date().toISOString()}] Estableciendo tiempo de ejecución para propuesta #${i}...`);
            const tx = await dao.executeProposal(BigInt(i));
            await tx.wait();
            console.log(`[${new Date().toISOString()}] Tiempo de ejecución establecido. TX: ${tx.hash}`);
          } else if (now >= executionTime + executionDelay) {
            // Ejecutar la propuesta
            console.log(`[${new Date().toISOString()}] Ejecutando propuesta #${i}...`);
            const tx = await dao.executeProposal(BigInt(i));
            const receipt = await tx.wait();
            console.log(`[${new Date().toISOString()}] Propuesta #${i} ejecutada exitosamente. TX: ${receipt.hash}`);
          } else {
            const remainingTime = executionTime + executionDelay - now;
            console.log(`[${new Date().toISOString()}] Propuesta #${i} esperando período de seguridad. Tiempo restante: ${remainingTime}s`);
          }
        }
      } catch (error: any) {
        console.error(`[${new Date().toISOString()}] Error procesando propuesta #${i}:`, error.message);
      }
    }
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Error en daemon:`, error.message);
  }
}

// Ejecutar inmediatamente y luego cada X segundos
console.log(`[${new Date().toISOString()}] Daemon iniciado. Verificando cada ${INTERVAL_SECONDS} segundos...`);
executeEligibleProposals();

setInterval(executeEligibleProposals, INTERVAL_SECONDS * 1000);

