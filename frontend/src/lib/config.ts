import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { anvil } from "wagmi/chains";

// Configuración de la red local (Anvil)
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545";

export const config = getDefaultConfig({
  appName: "DAO Voting",
  projectId: "dao-voting-app",
  chains: [anvil],
  transports: {
    [anvil.id]: http(rpcUrl, {
      retryCount: 3,
      retryDelay: 100,
      timeout: 10000,
    }),
  },
  ssr: true,
});

// Direcciones de los contratos (se actualizarán después del despliegue)
export const CONTRACT_ADDRESSES = {
  MinimalForwarder: process.env.NEXT_PUBLIC_FORWARDER_ADDRESS || "",
  DAOVoting: process.env.NEXT_PUBLIC_DAO_ADDRESS || "",
};

// RPC URL
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545";

// Chain ID
export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "31337");

