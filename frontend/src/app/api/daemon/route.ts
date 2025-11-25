import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { getDAOContract } from "@/lib/contracts";
import { RPC_URL } from "@/lib/config-server";

const DAO_ADDRESS = process.env.NEXT_PUBLIC_DAO_ADDRESS || "";
const DAEMON_PRIVATE_KEY = process.env.DAEMON_PRIVATE_KEY || "";

/**
 * API Route para ejecutar el daemon de verificación de propuestas
 * Puede ser llamado periódicamente con un cron job o servicio externo
 */
export async function GET(request: NextRequest) {
  try {
    if (!DAO_ADDRESS || !DAEMON_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "Daemon no configurado" },
        { status: 500 }
      );
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(DAEMON_PRIVATE_KEY, provider);
    const dao = getDAOContract(wallet);

    const proposalCount = await dao.proposalCount();
    const now = Math.floor(Date.now() / 1000);
    const executed: string[] = [];

    for (let i = 1; i <= Number(proposalCount); i++) {
      try {
        const proposal = await dao.getProposal(BigInt(i));

        const deadline = Number(proposal.deadline);
        const isDeadlinePassed = deadline < now;
        const isApproved = proposal.votesFor > proposal.votesAgainst;
        const isNotExecuted = !proposal.executed;

        if (isDeadlinePassed && isApproved && isNotExecuted) {
          const executionTime = Number(proposal.executionTime);
          const executionDelay = Number(await dao.EXECUTION_DELAY());

          if (executionTime === 0) {
            // Primera llamada: establecer executionTime
            const tx = await dao.executeProposal(BigInt(i));
            await tx.wait();
            executed.push(`Propuesta #${i}: Tiempo de ejecución establecido`);
          } else if (now >= executionTime + executionDelay) {
            // Ejecutar la propuesta
            const tx = await dao.executeProposal(BigInt(i));
            const receipt = await tx.wait();
            executed.push(`Propuesta #${i}: Ejecutada (TX: ${receipt.hash})`);
          }
        }
      } catch (error: any) {
        console.error(`Error procesando propuesta #${i}:`, error.message);
      }
    }

    return NextResponse.json({
      success: true,
      checked: Number(proposalCount),
      executed: executed.length,
      details: executed,
    });
  } catch (error: any) {
    console.error("Error en daemon:", error);
    return NextResponse.json(
      { error: error.message || "Error al ejecutar el daemon" },
      { status: 500 }
    );
  }
}


