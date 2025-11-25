"use client";

import { useState, useEffect } from "react";
import { useCreateProposal, useCanCreateProposal } from "@/hooks/useDAO";
import { useAccount } from "wagmi";

export function CreateProposal() {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [days, setDays] = useState("7");
  const [description, setDescription] = useState("");
  const [useGasless, setUseGasless] = useState(true);
  const { isConnected } = useAccount();
  const { createProposal, isPending, isConfirming, isSuccess, error } = useCreateProposal();
  const { canCreate, minRequired, currentBalance } = useCanCreateProposal();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount || !days) return;

    // Calcular deadline basado en días desde ahora
    const daysNumber = parseInt(days);
    const deadlineTimestamp = Math.floor(Date.now() / 1000) + (daysNumber * 24 * 60 * 60);
    
    createProposal(recipient, amount, deadlineTimestamp, description, useGasless);
    
    // Reset form solo si no está pendiente
    if (!isPending && !isConfirming) {
      setRecipient("");
      setAmount("");
      setDays("7");
      setDescription("");
      setUseGasless(true);
    }
  };

  // Reset form cuando la propuesta se crea exitosamente
  useEffect(() => {
    if (isSuccess) {
      // Esperar un momento para que el usuario vea el mensaje de éxito
      const timer = setTimeout(() => {
        setRecipient("");
        setAmount("");
        setDays("7");
        setDescription("");
        setUseGasless(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Crear Propuesta</h2>

      {!isConnected ? (
        <p className="text-gray-600 dark:text-gray-400">
          Conecta tu wallet para crear propuestas
        </p>
      ) : !canCreate ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200">
            Necesitas al menos el 10% del balance total del DAO para crear propuestas.
          </p>
          <p className="text-sm mt-2 text-yellow-700 dark:text-yellow-300">
            Balance actual: {currentBalance} ETH | Mínimo requerido: {minRequired} ETH
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Dirección del beneficiario
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
              placeholder="0x..."
              pattern="^0x[a-fA-F0-9]{40}$"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Cantidad de ETH
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
              placeholder="0.0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Descripción de la propuesta
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
              placeholder="Describe qué hace esta propuesta..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Días para votación
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
              placeholder="7"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              La votación estará abierta por {days} día{days !== "1" ? "s" : ""}
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="useGasless"
              checked={useGasless}
              onChange={(e) => setUseGasless(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="useGasless" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Usar transacción sin gas (relayer paga gas)
            </label>
          </div>

          <button
            type="submit"
            disabled={!recipient || !amount || !days || isPending || isConfirming}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {isPending
              ? "Confirmando..."
              : isConfirming
              ? "Creando propuesta..."
              : isSuccess
              ? "¡Propuesta creada!"
              : "Crear Propuesta"}
          </button>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm">
              Error: {error.message}
            </div>
          )}
        </form>
      )}
    </div>
  );
}


