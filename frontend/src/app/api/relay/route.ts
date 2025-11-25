import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { getForwarderContract, getDAOContract, MINIMAL_FORWARDER_ABI } from "@/lib/contracts";
import { CONTRACT_ADDRESSES, RPC_URL } from "@/lib/config-server";

// Clave privada del relayer (debe estar en variables de entorno)
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;

if (!RELAYER_PRIVATE_KEY) {
  console.warn("RELAYER_PRIVATE_KEY no configurada. El relayer no funcionará.");
}

export async function POST(request: NextRequest) {
  try {
    if (!RELAYER_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "Relayer no configurado" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { request: forwardRequest, signature } = body;

    // Validar request body
    if (!forwardRequest || !signature) {
      return NextResponse.json(
        { error: "Solicitud inválida: request y signature son requeridos" },
        { status: 400 }
      );
    }

    // Validar campos requeridos
    if (
      !forwardRequest.from ||
      !forwardRequest.to ||
      forwardRequest.value === undefined ||
      forwardRequest.gas === undefined ||
      forwardRequest.nonce === undefined ||
      !forwardRequest.data
    ) {
      return NextResponse.json(
        { error: "Solicitud inválida: campos requeridos faltantes" },
        { status: 400 }
      );
    }

    // Validar formato de direcciones
    if (!ethers.isAddress(forwardRequest.from) || !ethers.isAddress(forwardRequest.to)) {
      return NextResponse.json(
        { error: "Direcciones inválidas" },
        { status: 400 }
      );
    }

    // Conectar al provider
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const relayer = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);

    // Obtener contratos
    const forwarder = getForwarderContract(relayer);

    // Convertir valores a BigInt (pueden venir como strings)
    const value = typeof forwardRequest.value === "string" 
      ? (forwardRequest.value.startsWith("0x") ? BigInt(forwardRequest.value) : BigInt(forwardRequest.value))
      : BigInt(forwardRequest.value);
    const gas = typeof forwardRequest.gas === "string"
      ? (forwardRequest.gas.startsWith("0x") ? BigInt(forwardRequest.gas) : BigInt(forwardRequest.gas))
      : BigInt(forwardRequest.gas);
    const nonce = typeof forwardRequest.nonce === "string"
      ? (forwardRequest.nonce.startsWith("0x") ? BigInt(forwardRequest.nonce) : BigInt(forwardRequest.nonce))
      : BigInt(forwardRequest.nonce);

    // Verificar la firma
    const verifyRequest = {
      from: forwardRequest.from,
      to: forwardRequest.to,
      value,
      gas,
      nonce,
      data: forwardRequest.data,
    };

    // Verificar el nonce antes de verificar la firma
    const currentNonce = await forwarder.getNonce(verifyRequest.from);
    console.log("Verificando firma:", {
      request: verifyRequest,
      currentNonce: currentNonce.toString(),
      requestNonce: verifyRequest.nonce.toString(),
      signature: signature.substring(0, 20) + "...",
    });

    // Verificar que el nonce coincida
    if (currentNonce !== verifyRequest.nonce) {
      console.error("Nonce no coincide:", {
        current: currentNonce.toString(),
        request: verifyRequest.nonce.toString(),
      });
      return NextResponse.json(
        { error: `Nonce no coincide. Esperado: ${currentNonce.toString()}, Recibido: ${verifyRequest.nonce.toString()}` },
        { status: 400 }
      );
    }

    const isValid = await forwarder.verify(verifyRequest, signature);

    if (!isValid) {
      console.error("Firma inválida. Request:", verifyRequest);
      // Intentar obtener más información del error
      try {
        // Verificar manualmente la firma para obtener más detalles
        const recoveredAddress = await forwarder.verify.staticCall(verifyRequest, signature).catch(() => null);
        console.error("Dirección recuperada de la firma:", recoveredAddress);
        console.error("Dirección esperada:", verifyRequest.from);
      } catch (e) {
        console.error("Error al verificar manualmente:", e);
      }
      return NextResponse.json(
        { error: "Firma inválida" },
        { status: 400 }
      );
    }

    // Conectar con MinimalForwarder y ejecutar la meta-transacción
    try {
      const tx = await forwarder.execute(
        {
          from: forwardRequest.from,
          to: forwardRequest.to,
          value: BigInt(forwardRequest.value),
          gas: BigInt(forwardRequest.gas),
          nonce: BigInt(forwardRequest.nonce),
          data: forwardRequest.data,
        },
        signature,
        { value: BigInt(forwardRequest.value) }
      );

      // Esperar confirmación
      const receipt = await tx.wait();

      return NextResponse.json({
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });
    } catch (error: any) {
      // Manejar errores específicos
      if (error.code === "NONCE_EXPIRED") {
        return NextResponse.json(
          { error: "Nonce expirado. Por favor, intenta de nuevo." },
          { status: 400 }
        );
      }
      if (error.message?.includes("insufficient funds")) {
        return NextResponse.json(
          { error: "Relayer sin fondos suficientes" },
          { status: 500 }
        );
      }
      throw error;
    }
  } catch (error: any) {
    console.error("Error en relayer:", error);
    return NextResponse.json(
      { error: error.message || "Error al procesar la transacción" },
      { status: 500 }
    );
  }
}

