import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { getDAOContract } from "@/lib/contracts";
import { RPC_URL } from "@/lib/config-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const proposalId = parseInt(id);

    if (isNaN(proposalId) || proposalId <= 0) {
      return NextResponse.json(
        { error: "ID de propuesta inválido" },
        { status: 400 }
      );
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const dao = getDAOContract(provider);

    // Verificar que la propuesta existe
    const proposalCount = await dao.proposalCount();
    if (BigInt(proposalId) > proposalCount || BigInt(proposalId) === 0n) {
      return NextResponse.json(
        { error: "Propuesta no encontrada" },
        { status: 404 }
      );
    }

    const proposal = await dao.getProposal(BigInt(proposalId));

    // Verificar que la propuesta tiene datos válidos
    if (!proposal || proposal.id === 0n) {
      return NextResponse.json(
        { error: "Propuesta no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: proposal.id.toString(),
      proposer: proposal.proposer,
      recipient: proposal.recipient,
      amount: proposal.amount.toString(),
      deadline: proposal.deadline.toString(),
      description: proposal.description || "",
      votesFor: proposal.votesFor.toString(),
      votesAgainst: proposal.votesAgainst.toString(),
      votesAbstain: proposal.votesAbstain.toString(),
      executed: proposal.executed,
      executionTime: proposal.executionTime.toString(),
    });
  } catch (error: any) {
    console.error("Error al obtener propuesta:", error);
    
    // Si es un error de que la propuesta no existe, retornar 404
    if (error.message?.includes("revert") || error.message?.includes("not found")) {
      return NextResponse.json(
        { error: "Propuesta no encontrada" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Error al obtener la propuesta" },
      { status: 500 }
    );
  }
}


