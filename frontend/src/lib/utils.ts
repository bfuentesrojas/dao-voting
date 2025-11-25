import { formatEther } from "ethers";

export function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatDate(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatETH(amount: bigint | string): string {
  // Si es string, convertirlo a bigint primero (asumiendo que está en wei)
  const amountBigInt = typeof amount === "string" ? BigInt(amount) : amount;
  const value = formatEther(amountBigInt);
  return `${parseFloat(value).toFixed(4)} ETH`;
}

export function getProposalStatus(proposal: any): {
  status: "active" | "approved" | "rejected" | "executed";
  label: string;
  color: string;
} {
  if (proposal.executed) {
    return { status: "executed", label: "Ejecutada", color: "bg-green-500" };
  }

  const now = Math.floor(Date.now() / 1000);
  if (Number(proposal.deadline) < now) {
    if (proposal.votesFor > proposal.votesAgainst) {
      return { status: "approved", label: "Aprobada", color: "bg-blue-500" };
    } else {
      return { status: "rejected", label: "Rechazada", color: "bg-red-500" };
    }
  }

  return { status: "active", label: "Activa", color: "bg-yellow-500" };
}


