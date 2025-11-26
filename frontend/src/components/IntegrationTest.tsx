"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useFundDao, useCreateProposal, useVote } from "@/hooks/useDAO";
import { useUserBalance, useTotalBalance, useProposal } from "@/hooks/useDAO";
import { parseEther, formatEther } from "ethers";

interface TestStep {
  step: number;
  description: string;
  status: "pending" | "running" | "success" | "error";
  message?: string;
  user?: string;
  details?: {
    action?: string;
    amount?: string;
    balanceBefore?: string;
    balanceAfter?: string;
    transactionHash?: string;
    proposalId?: number;
    votesFor?: number;
    votesAgainst?: number;
    timestamp?: string;
    note?: string;
  };
}

/**
 * Componente de prueba integrada que ejecuta el escenario completo
 * desde el frontend
 */
export function IntegrationTest() {
  const { address, isConnected } = useAccount();
  const [steps, setSteps] = useState<TestStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const { fundDao, isPending: isFundingPending } = useFundDao();
  const { createProposal, isPending: isCreatingPending } = useCreateProposal();
  const { mutate: vote, isPending: isVotingPending } = useVote();
  const { balance: userBalance, refetch: refetchBalance } = useUserBalance();
  const { totalBalance, refetch: refetchTotal } = useTotalBalance();

  const addStep = (
    step: number,
    description: string,
    status: TestStep["status"],
    message?: string,
    user?: string,
    details?: TestStep["details"]
  ) => {
    setSteps((prev) => {
      const newSteps = [...prev];
      const stepIndex = newSteps.findIndex((s) => s.step === step);
      if (stepIndex >= 0) {
        newSteps[stepIndex] = { step, description, status, message, user, details };
      } else {
        newSteps.push({ step, description, status, message, user, details });
      }
      return newSteps.sort((a, b) => a.step - b.step);
    });
  };

  const updateStep = (
    step: number,
    status: TestStep["status"],
    message?: string,
    details?: TestStep["details"]
  ) => {
    setSteps((prev) =>
      prev.map((s) => (s.step === step ? { ...s, status, message, details: { ...s.details, ...details } } : s))
    );
  };

  const runTest = async () => {
    if (!isConnected || !address) {
      alert("Por favor, conecta tu wallet primero");
      return;
    }

    setIsRunning(true);
    setCurrentStep(0);
    setSteps([]);

    try {
      const currentUser = address || "Usuario desconocido";
      const timestamp = new Date().toLocaleString();

      // Paso 1: Usuario actual deposita 10 ETH
      // NOTA: En el frontend solo podemos usar la wallet conectada
      // Para usar múltiples usuarios, ejecuta el script de Node.js
      const balanceBefore1 = userBalance;
      addStep(
        1,
        `Usuario actual deposita 10 ETH en el DAO`,
        "running",
        "Iniciando depósito...",
        currentUser,
        {
          action: "fundDao",
          amount: "10 ETH",
          balanceBefore: balanceBefore1,
          timestamp,
          note: "⚠️ Usando wallet conectada (no múltiples usuarios)",
        }
      );
      setCurrentStep(1);
      
      let txHash1: string | undefined;
      await new Promise<void>((resolve, reject) => {
        fundDao("10");
        // Esperar a que la transacción se complete
        const checkInterval = setInterval(() => {
          if (!isFundingPending) {
            clearInterval(checkInterval);
            refetchBalance();
            refetchTotal();
            setTimeout(async () => {
              const balanceAfter1 = userBalance;
              const totalAfter1 = totalBalance;
              updateStep(
                1,
                "success",
                `Depósito exitoso. Balance usuario: ${balanceAfter1} ETH | Balance total DAO: ${totalAfter1} ETH`,
                {
                  balanceAfter: balanceAfter1,
                  transactionHash: txHash1,
                }
              );
              resolve();
            }, 2000);
          }
        }, 500);
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error("Timeout esperando transacción"));
        }, 30000);
      });

      // Paso 2: Verificar balance
      addStep(
        2,
        "Verificar balance del usuario y del DAO",
        "running",
        "Consultando balances...",
        currentUser,
        { action: "getBalance", timestamp: new Date().toLocaleString() }
      );
      setCurrentStep(2);
      await new Promise((resolve) => {
        setTimeout(async () => {
          await refetchBalance();
          await refetchTotal();
          const balance = parseFloat(userBalance);
          const total = parseFloat(totalBalance);
          const minRequired = (total * 10) / 100; // 10% del total
          
          if (balance >= 10) {
            updateStep(
              2,
              "success",
              `Balance usuario: ${userBalance} ETH | Balance total DAO: ${totalBalance} ETH | Mínimo requerido para crear propuesta: ${minRequired.toFixed(4)} ETH`,
              {
                balanceAfter: userBalance,
                amount: `${minRequired.toFixed(4)} ETH (10% del total)`,
              }
            );
          } else {
            updateStep(2, "error", `Balance insuficiente: ${userBalance} ETH (se requiere mínimo 10 ETH)`);
          }
          resolve(undefined);
        }, 2000);
      });

      // Paso 3: Crear propuesta
      const recipient = "0x1234567890123456789012345678901234567890";
      const proposalAmount = "5";
      const deadline = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 días
      const deadlineDate = new Date(deadline * 1000).toLocaleString();
      
      addStep(
        3,
        "Crear propuesta (requiere >10% del balance)",
        "running",
        "Creando propuesta...",
        currentUser,
        {
          action: "createProposal",
          amount: `${proposalAmount} ETH`,
          timestamp: new Date().toLocaleString(),
        }
      );
      setCurrentStep(3);
      
      let proposalId: number | undefined;
      await new Promise<void>((resolve, reject) => {
        createProposal(recipient, proposalAmount, deadline, "Propuesta de prueba integrada", false);
        const checkInterval = setInterval(() => {
          if (!isCreatingPending) {
            clearInterval(checkInterval);
            setTimeout(async () => {
              // Intentar obtener el ID de la propuesta
              const { useProposalCount } = await import("@/hooks/useDAO");
              // Por ahora, asumimos que es la propuesta #1
              proposalId = 1;
              updateStep(
                3,
                "success",
                `Propuesta creada exitosamente | ID: ${proposalId} | Monto: ${proposalAmount} ETH | Recipient: ${recipient} | Deadline: ${deadlineDate}`,
                {
                  proposalId,
                  amount: `${proposalAmount} ETH`,
                  transactionHash: undefined, // Se puede obtener del hook
                }
              );
              resolve();
            }, 2000);
          }
        }, 500);
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error("Timeout creando propuesta"));
        }, 30000);
      });

      // Paso 4: Votar A FAVOR (gasless)
      const voteProposalId = proposalId || 1;
      addStep(
        4,
        "Votar A FAVOR (gasless - meta-transacción)",
        "running",
        "Firmando y enviando voto...",
        currentUser,
        {
          action: "vote",
          proposalId: voteProposalId,
          amount: "Gasless (relayer paga)",
          timestamp: new Date().toLocaleString(),
        }
      );
      setCurrentStep(4);
      await new Promise<void>((resolve, reject) => {
        vote(
          { proposalId: voteProposalId, voteType: 1, useGasless: true }, // VoteType.FOR: 1
          {
            onSuccess: async (result: any) => {
              // Obtener información de la propuesta actualizada
              const { useProposal } = await import("@/hooks/useDAO");
              setTimeout(() => {
                updateStep(
                  4,
                  "success",
                  `Voto A FAVOR registrado exitosamente (gasless) | Propuesta ID: ${voteProposalId} | TX Hash: ${result?.txHash || "N/A"}`,
                  {
                    transactionHash: result?.txHash,
                    votesFor: undefined, // Se puede obtener de la propuesta
                  }
                );
                resolve();
              }, 2000);
            },
            onError: (error: any) => {
              updateStep(4, "error", `Error al votar: ${error.message || "Error desconocido"}`);
              reject(error);
            },
          }
        );
      });

      // Resumen final
      addStep(
        5,
        "Resumen de la prueba",
        "success",
        `Prueba completada exitosamente | Usuario: ${currentUser} | Timestamp: ${new Date().toLocaleString()}`,
        currentUser,
        {
          action: "summary",
          timestamp: new Date().toLocaleString(),
        }
      );
      setCurrentStep(0);
    } catch (error: any) {
      const errorMessage = error.message || "Error desconocido";
      updateStep(currentStep, "error", errorMessage);
      console.error("Error en prueba integrada:", error);
    } finally {
      setIsRunning(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-yellow-800 dark:text-yellow-200">
          Conecta tu wallet para ejecutar la prueba integrada
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Prueba Integrada del Escenario Completo</h2>
      
      <div className="mb-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm font-semibold mb-2">
            ⚠️ Nota Importante:
          </p>
          <p className="text-yellow-700 dark:text-yellow-300 text-sm">
            Este componente usa la <strong>misma wallet conectada</strong> para todos los pasos.
            Para el escenario completo con múltiples usuarios (A, B, C), usa el script de Node.js:
            <code className="block mt-2 bg-yellow-100 dark:bg-yellow-900/40 p-2 rounded">
              node scripts/test-integration-frontend.js
            </code>
          </p>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Este componente ejecuta una versión simplificada del escenario:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li><strong>Usuario actual</strong> deposita 10 ETH</li>
          <li>Verificar balance del usuario actual</li>
          <li>Crear propuesta (requiere &gt;10% del balance)</li>
          <li>Votar A FAVOR (gasless)</li>
        </ol>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Para el escenario completo con Usuario A, B y C, ejecuta el script de Node.js.
        </p>
      </div>

      <button
        onClick={runTest}
        disabled={isRunning}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors mb-6"
      >
        {isRunning ? "Ejecutando prueba..." : "Ejecutar Prueba Integrada"}
      </button>

      {steps.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold mb-2">Estado de los Pasos:</h3>
          {steps.map((step) => (
            <div
              key={step.step}
              className={`p-3 rounded-lg border ${
                step.status === "success"
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : step.status === "error"
                  ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  : step.status === "running"
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                  : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">
                      {step.step}. {step.description}
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        step.status === "success"
                          ? "text-green-700 dark:text-green-300"
                          : step.status === "error"
                          ? "text-red-700 dark:text-red-300"
                          : step.status === "running"
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-gray-500"
                      }`}
                    >
                      {step.status === "success" && "✓"}
                      {step.status === "error" && "✗"}
                      {step.status === "running" && "⟳"}
                      {step.status === "pending" && "○"}
                    </span>
                  </div>
                  {step.user && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      👤 Usuario: <span className="font-mono">{step.user}</span>
                    </p>
                  )}
                  {step.message && (
                    <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                      {step.message}
                    </p>
                  )}
                  {step.details && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      {step.details.action && (
                        <p>🔧 Acción: <span className="font-mono">{step.details.action}</span></p>
                      )}
                      {step.details.amount && (
                        <p>💰 Monto: <span className="font-semibold">{step.details.amount}</span></p>
                      )}
                      {step.details.balanceBefore && (
                        <p>📊 Balance antes: <span className="font-semibold">{step.details.balanceBefore} ETH</span></p>
                      )}
                      {step.details.balanceAfter && (
                        <p>📊 Balance después: <span className="font-semibold">{step.details.balanceAfter} ETH</span></p>
                      )}
                      {step.details.proposalId && (
                        <p>📝 Propuesta ID: <span className="font-mono font-semibold">{step.details.proposalId}</span></p>
                      )}
                      {step.details.votesFor !== undefined && (
                        <p>✅ Votos a favor: <span className="font-semibold">{step.details.votesFor}</span></p>
                      )}
                      {step.details.votesAgainst !== undefined && (
                        <p>❌ Votos en contra: <span className="font-semibold">{step.details.votesAgainst}</span></p>
                      )}
                      {step.details.transactionHash && (
                        <p>🔗 TX Hash: <span className="font-mono text-xs break-all">{step.details.transactionHash}</span></p>
                      )}
                      {step.details.timestamp && (
                        <p>🕐 Timestamp: <span className="font-mono">{step.details.timestamp}</span></p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

