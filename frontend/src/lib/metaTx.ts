import { ethers } from "ethers";
import { getForwarderContract, getDAOContract } from "./contracts";
import { CONTRACT_ADDRESSES } from "./config";
import { signWithEthers } from "./signing";

export interface ForwardRequest {
  from: string;
  to: string;
  value: bigint;
  gas: bigint;
  nonce: bigint;
  data: string;
}

/**
 * Genera una meta-transacción para votar en una propuesta
 * Esta función debe ser llamada desde el cliente con un signer
 */
export async function generateVoteMetaTx(
  signer: ethers.Signer,
  proposalId: bigint,
  voteType: number
): Promise<{ request: ForwardRequest; signature: string }> {
  const forwarder = getForwarderContract(signer);
  const dao = getDAOContract(signer);
  const from = await signer.getAddress();
  const nonce = await forwarder.getNonce(from);

  // Codificar la llamada a vote()
  const data = dao.interface.encodeFunctionData("vote", [proposalId, voteType]);

  const request: ForwardRequest = {
    from,
    to: CONTRACT_ADDRESSES.DAOVoting,
    value: 0n,
    gas: 100000n,
    nonce,
    data,
  };

  // Firmar la solicitud usando EIP-712
  const signature = await signTypedData(signer, request);

  return { request, signature };
}

/**
 * Firma una solicitud usando EIP-712
 * Usa signWithEthers para compatibilidad con ethers.js
 */
async function signTypedData(
  signer: ethers.Signer,
  request: ForwardRequest
): Promise<string> {
  return signWithEthers(signer, request);
}

/**
 * Envía una meta-transacción al relayer
 */
export async function relayMetaTx(
  request: ForwardRequest,
  signature: string
): Promise<string> {
  const response = await fetch("/api/relay", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      request: {
        from: request.from,
        to: request.to,
        value: request.value.toString(),
        gas: request.gas.toString(),
        nonce: request.nonce.toString(),
        data: request.data,
      },
      signature,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.message || "Failed to relay transaction");
  }

  const result = await response.json();
  return result.txHash;
}
