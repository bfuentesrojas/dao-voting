"use client";

import { createContext, useContext, ReactNode } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useUserBalance } from "@/hooks/useDAO";

interface WalletContextType {
  address: string | undefined;
  isConnected: boolean;
  chainId: number;
  balance: string;
  isLoading: boolean;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { address, isConnected, chainId, disconnect } = useWallet();
  const { balance, isLoading } = useUserBalance();

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        chainId,
        balance,
        isLoading,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWalletContext must be used within a WalletProvider");
  }
  return context;
}




