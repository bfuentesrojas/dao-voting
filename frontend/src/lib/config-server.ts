// Configuración para uso en el servidor (API routes)
// No incluye configuración de RainbowKit/Wagmi que es solo del cliente

// Direcciones de los contratos (se actualizarán después del despliegue)
export const CONTRACT_ADDRESSES = {
  MinimalForwarder: process.env.NEXT_PUBLIC_FORWARDER_ADDRESS || "",
  DAOVoting: process.env.NEXT_PUBLIC_DAO_ADDRESS || "",
};

// RPC URL
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545";

// Chain ID
export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "31337");



