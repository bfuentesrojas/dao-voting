"use client";

import { useState } from "react";
import { useFundDao, useUserBalance, useTotalBalance, useProposalCount } from "@/hooks/useDAO";
import { useAccount } from "wagmi";

export function FundingPanel() {
  const [amount, setAmount] = useState("");
  const { address, isConnected } = useAccount();
  const { fundDao, isPending, isConfirming, isSuccess, error } = useFundDao();
  const { balance, refetch: refetchBalance } = useUserBalance();
  const { totalBalance, refetch: refetchTotal } = useTotalBalance();
  const { count: proposalCount } = useProposalCount();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    fundDao(amount);
    setAmount("");
  };

  if (isSuccess) {
    refetchBalance();
    refetchTotal();
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Financiar DAO</h2>

      {!isConnected ? (
        <p className="text-gray-600 dark:text-gray-400">
          Conecta tu wallet para financiar el DAO
        </p>
      ) : (
        <>
          <div className="mb-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Tu balance en DAO:</span>
              <span className="font-semibold">{balance} ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Balance total del DAO:</span>
              <span className="font-semibold">{totalBalance} ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Propuestas creadas:</span>
              <span className="font-semibold">{proposalCount.toString()}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Cantidad de ETH a depositar
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
                placeholder="0.0"
                disabled={isPending || isConfirming}
              />
            </div>

            <button
              type="submit"
              disabled={!amount || parseFloat(amount) <= 0 || isPending || isConfirming}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {isPending
                ? "Confirmando..."
                : isConfirming
                ? "Procesando..."
                : isSuccess
                ? "¡Depositado!"
                : "Depositar ETH"}
            </button>

            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="font-semibold">Error al procesar la transacción:</p>
                <p className="mt-1">
                  {error.message?.includes("too many errors") || error.message?.includes("RPC endpoint")
                    ? "El nodo RPC no está respondiendo. Por favor, espera unos segundos e intenta nuevamente."
                    : error.message || "Error desconocido"}
                </p>
                {error.message?.includes("too many errors") && (
                  <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    Asegúrate de que Anvil esté corriendo: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">anvil</code>
                  </p>
                )}
              </div>
            )}
          </form>
        </>
      )}
    </div>
  );
}


