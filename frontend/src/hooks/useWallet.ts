"use client";

import { useAccount, useChainId, useDisconnect, useSwitchChain } from "wagmi";
import { useEffect, useState } from "react";
import { anvil } from "wagmi/chains";

/**
 * Hook personalizado para MetaMask y manejo de wallet
 */
export function useWallet() {
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [isConnecting, setIsConnecting] = useState(false);

  // Agregar red Anvil a MetaMask si no existe y cambiar a ella
  useEffect(() => {
    if (!isConnected || !window.ethereum || chainId === anvil.id) return;

    const addAnvilNetwork = async () => {
      try {
        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545";
        
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${anvil.id.toString(16)}`,
              chainName: "Anvil Local",
              nativeCurrency: {
                name: "Ether",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: [rpcUrl],
              blockExplorerUrls: [],
            },
          ],
        });
      } catch (error: any) {
        // Si la red ya existe, solo cambiar a ella
        if (error.code === 4902 || error.message?.includes("already exists")) {
          try {
            await switchChain({ chainId: anvil.id });
          } catch (switchError) {
            console.error("Error al cambiar a la red Anvil:", switchError);
          }
        } else {
          console.error("Error al agregar red Anvil:", error);
        }
      }
    };

    // Intentar cambiar a Anvil primero, si falla agregar la red
    const switchToAnvil = async () => {
      try {
        await switchChain({ chainId: anvil.id });
      } catch (error: any) {
        // Si no puede cambiar, probablemente la red no existe, agregarla
        if (error?.name === "ChainNotConfiguredError" || error?.code === 4902) {
          await addAnvilNetwork();
        } else {
          console.error("Error al cambiar a la red Anvil:", error);
        }
      }
    };

    switchToAnvil();
  }, [isConnected, chainId, switchChain]);

  // Manejar cambios de cuenta
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      }
    };

    const handleChainChanged = () => {
      // Recargar la página cuando cambie la red
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [disconnect]);

  return {
    address,
    isConnected,
    chainId,
    connector,
    isConnecting,
    disconnect,
  };
}

// Extender Window interface para TypeScript
declare global {
  interface Window {
    ethereum?: {
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
    };
  }
}



