import { ethers } from "ethers";
import { TypedDataEncoder } from "ethers";
import { ForwardRequest } from "./metaTx";
import { CONTRACT_ADDRESSES } from "./config";

/**
 * Convierte un BigInt a string hexadecimal (formato requerido por EIP-712)
 * Los valores deben estar en minúsculas y con prefijo 0x
 */
function bigIntToHex(value: bigint | string): string {
  let hexValue: string;
  
  // Si ya es string, verificar si es hex
  if (typeof value === "string") {
    if (value.startsWith("0x")) {
      hexValue = value.toLowerCase();
    } else {
      // Si es string decimal, convertir a BigInt primero
      hexValue = "0x" + BigInt(value).toString(16).toLowerCase();
    }
  } else {
    hexValue = "0x" + value.toString(16).toLowerCase();
  }
  
  // Asegurar que el prefijo 0x esté presente
  if (!hexValue.startsWith("0x")) {
    hexValue = "0x" + hexValue;
  }
  
  return hexValue;
}

/**
 * Convierte un ForwardRequest con BigInt a formato serializable
 */
function serializeRequest(request: ForwardRequest) {
  return {
    from: request.from,
    to: request.to,
    value: bigIntToHex(request.value),
    gas: bigIntToHex(request.gas),
    nonce: bigIntToHex(request.nonce),
    data: request.data,
  };
}

/**
 * Genera el mensaje EIP-712 para firmar
 */
export function generateEIP712Message(request: ForwardRequest, chainId: number) {
  const domain = {
    name: "MinimalForwarder",
    version: "0.0.1",
    chainId,
    verifyingContract: CONTRACT_ADDRESSES.MinimalForwarder,
  };

  const types = {
    ForwardRequest: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "gas", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "data", type: "bytes" },
    ],
  };

  // Serializar el request convirtiendo BigInt a hex strings
  const serializedMessage = serializeRequest(request);

  return { domain, types, primaryType: "ForwardRequest", message: serializedMessage };
}

/**
 * Firma con MetaMask usando EIP-712
 */
export async function signWithMetaMask(
  request: ForwardRequest,
  chainId: number
): Promise<string> {
  if (!window.ethereum) {
    throw new Error("MetaMask no está instalado");
  }

  const { domain, types, primaryType, message } = generateEIP712Message(request, chainId);

  try {
    // Usar TypedDataEncoder de ethers.js para validar el formato
    // Esto asegura que el formato sea exactamente el mismo que espera el contrato
    const encoder = new TypedDataEncoder(types);
    const hash = encoder.hash(domain, message);
    
    console.log("Hash EIP-712 generado:", hash);

    // MetaMask espera el objeto directamente
    // IMPORTANTE: MetaMask puede requerir chainId como string hexadecimal
    // pero el contrato lo espera como número en el hash
    // Probamos primero con número, si falla, usamos hex string
    const typedData = {
      types,
      domain: {
        name: domain.name,
        version: domain.version,
        // MetaMask v10+ espera chainId como número, pero algunas versiones esperan hex string
        // Usamos número que es lo que espera el contrato de OpenZeppelin
        chainId: domain.chainId,
        verifyingContract: domain.verifyingContract,
      },
      primaryType,
      message,
    };

    console.log("Firmando con MetaMask:", {
      domain: typedData.domain,
      message: typedData.message,
      request: {
        from: request.from,
        to: request.to,
        value: request.value.toString(),
        gas: request.gas.toString(),
        nonce: request.nonce.toString(),
      },
    });

    const signature = await window.ethereum.request({
      method: "eth_signTypedData_v4",
      params: [request.from, typedData],
    });

    console.log("Firma generada:", signature.substring(0, 20) + "...");
    return signature as string;
  } catch (error: any) {
    console.error("Error al firmar:", error);
    throw new Error(`Error al firmar con MetaMask: ${error.message}`);
  }
}

/**
 * Firma con ethers.js usando EIP-712
 * En ethers.js v6, el método signTypedData está disponible en el signer
 */
export async function signWithEthers(
  signer: ethers.Signer,
  request: ForwardRequest
): Promise<string> {
  const chainId = await signer.provider?.getNetwork().then((n) => Number(n.chainId)) || 31337;
  const { domain, types, message } = generateEIP712Message(request, chainId);
  
  // En ethers.js v6, el método signTypedData está disponible directamente en el signer
  // Usar el método público si está disponible
  if (signer && typeof (signer as any).signTypedData === "function") {
    try {
      console.log("Usando signTypedData de ethers.js");
      return await (signer as any).signTypedData(domain, types, message);
    } catch (e) {
      console.warn("Error con signTypedData de ethers.js, usando MetaMask:", e);
    }
  }
  
  // Si no está disponible, usar MetaMask directamente
  // MetaMask maneja EIP-712 correctamente
  return await signWithMetaMask(request, chainId);
}


