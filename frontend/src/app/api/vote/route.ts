import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { generateVoteMetaTx, relayMetaTx } from "@/lib/metaTx";
import { RPC_URL } from "@/lib/config-server";
import { VoteType } from "@/lib/contracts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { proposalId, voteType } = body;

    if (proposalId === undefined || voteType === undefined) {
      return NextResponse.json(
        { error: "proposalId y voteType son requeridos" },
        { status: 400 }
      );
    }

    // Obtener la firma del frontend (debe venir en el body)
    const { signature, request: forwardRequest } = body;

    if (!signature || !forwardRequest) {
      return NextResponse.json(
        { error: "Firma y solicitud son requeridas" },
        { status: 400 }
      );
    }

    // Enviar al relayer
    const txHash = await relayMetaTx(forwardRequest, signature);

    return NextResponse.json({
      success: true,
      txHash,
    });
  } catch (error: any) {
    console.error("Error al votar:", error);
    return NextResponse.json(
      { error: error.message || "Error al procesar el voto" },
      { status: 500 }
    );
  }
}


