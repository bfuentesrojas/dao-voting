"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useWalletContext } from "@/contexts/WalletContext";
import { formatAddress } from "@/lib/utils";

export function ConnectWallet() {
  const { address, isConnected, balance, isLoading } = useWalletContext();

  return (
    <div className="flex items-center gap-4">
      {isConnected && address && (
        <div className="flex items-center gap-4 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg">
          <div className="text-sm">
            <div className="font-semibold">{formatAddress(address)}</div>
            <div className="text-gray-600 dark:text-gray-400">
              Balance DAO: {isLoading ? "..." : `${balance} ETH`}
            </div>
          </div>
        </div>
      )}
      <ConnectButton />
    </div>
  );
}




