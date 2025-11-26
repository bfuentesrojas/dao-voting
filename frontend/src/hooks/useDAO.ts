import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useAccount } from "wagmi";
import { getDAOContract, DAO_VOTING_ABI, VoteType, Proposal } from "@/lib/contracts";
import { CONTRACT_ADDRESSES } from "@/lib/config";
import { formatEther, parseEther } from "ethers";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import type { ForwardRequest } from "@/lib/metaTx";

export function useUserBalance() {
  const { address } = useAccount();

  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.DAOVoting as `0x${string}`,
    abi: DAO_VOTING_ABI,
    functionName: "getUserBalance",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    balance: data ? formatEther(data) : "0",
    isLoading,
    refetch,
  };
}

export function useTotalBalance() {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.DAOVoting as `0x${string}`,
    abi: DAO_VOTING_ABI,
    functionName: "totalBalance",
  });

  return {
    totalBalance: data ? formatEther(data) : "0",
    isLoading,
    refetch,
  };
}

export function useProposalCount() {
  const { data, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.DAOVoting as `0x${string}`,
    abi: DAO_VOTING_ABI,
    functionName: "proposalCount",
    query: {
      // Refetch cada 2 segundos para detectar cambios
      refetchInterval: 2000,
    },
  });

  return { count: data ? Number(data) : 0, refetch };
}

export function useProposal(proposalId: number) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.DAOVoting as `0x${string}`,
    abi: DAO_VOTING_ABI,
    functionName: "getProposal",
    args: [BigInt(proposalId)],
    query: {
      enabled: proposalId > 0,
    },
  });

  return {
    proposal: data as Proposal | undefined,
    isLoading,
    refetch,
  };
}

export function useProposals() {
  const { count, refetch: refetchCount } = useProposalCount();
  const proposalIds = Array.from({ length: Number(count) || 0 }, (_, i) => i + 1);

  // Log para debugging
  useEffect(() => {
    console.log("🔢 useProposals - Count actualizado:", count, "IDs:", proposalIds);
  }, [count, proposalIds.length]);

  return useQuery({
    queryKey: ["proposals", count],
    queryFn: async () => {
      console.log("📥 useProposals - Fetching propuestas, count:", count);
      if (!count || count === 0) return [];
      
      const results = await Promise.all(
        proposalIds.map(async (id) => {
          try {
            const response = await fetch(`/api/proposal/${id}`);
            if (!response.ok) {
              // Si es 404, la propuesta no existe, retornar null
              if (response.status === 404) return null;
              // Para otros errores, también retornar null
              return null;
            }
            const data = await response.json();
            // Convertir strings a bigint para campos numéricos
            return {
              ...data,
              id: BigInt(data.id),
              amount: BigInt(data.amount),
              deadline: BigInt(data.deadline),
              votesFor: BigInt(data.votesFor),
              votesAgainst: BigInt(data.votesAgainst),
              votesAbstain: BigInt(data.votesAbstain),
              executionTime: BigInt(data.executionTime),
            };
          } catch (error) {
            console.error(`Error al obtener propuesta ${id}:`, error);
            return null;
          }
        })
      );
      // Filtrar nulls y retornar solo propuestas válidas
      return results.filter((p) => p !== null);
    },
    enabled: count > 0,
    retry: false, // No reintentar si falla
  });
}

export function useFundDao() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const fundDao = (amount: string) => {
    writeContract({
      address: CONTRACT_ADDRESSES.DAOVoting as `0x${string}`,
      abi: DAO_VOTING_ABI,
      functionName: "fundDao",
      value: parseEther(amount) as bigint,
    });
  };

  if (isSuccess) {
    queryClient.invalidateQueries({ queryKey: ["userBalance"] });
    queryClient.invalidateQueries({ queryKey: ["totalBalance"] });
  }

  return {
    fundDao,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useCreateProposal() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { address } = useAccount();
  const [gaslessSuccess, setGaslessSuccess] = useState(false);
  const [gaslessPending, setGaslessPending] = useState(false);

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Resetear estado de éxito cuando se inicia una nueva creación
  useEffect(() => {
    if (gaslessSuccess) {
      const timer = setTimeout(() => {
        setGaslessSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [gaslessSuccess]);

  const createProposal = async (
    recipient: string,
    amount: string,
    deadline: number,
    description: string = "",
    useGasless: boolean = true
  ) => {
    // Si useGasless es true, usar meta-transacción
    if (useGasless && address) {
      setGaslessPending(true);
      setGaslessSuccess(false);
      try {
        // Importar dinámicamente para evitar problemas de SSR
        const { ethers } = await import("ethers");
        const { relayMetaTx } = await import("@/lib/metaTx");
        const { signWithEthers } = await import("@/lib/signing");
        const { getForwarderContract, getDAOContract } = await import("@/lib/contracts");
        const { CONTRACT_ADDRESSES } = await import("@/lib/config");
        const { getWalletClient } = await import("wagmi/actions");
        const { config } = await import("@/lib/config");
        const { parseEther } = await import("ethers");

        const walletClient = await getWalletClient(config);
        if (!walletClient) throw new Error("Wallet no disponible");

        // Crear signer desde walletClient
        const provider = new ethers.BrowserProvider(walletClient as any);
        const signer = await provider.getSigner();

        // Obtener contratos
        const forwarder = getForwarderContract(signer);
        const dao = getDAOContract(signer);

        // Codificar la llamada a createProposal()
        const data = dao.interface.encodeFunctionData("createProposal", [
          recipient as `0x${string}`,
          parseEther(amount),
          BigInt(deadline),
          description || "", // Descripción de la propuesta
        ]);

        // Intentar hasta 3 veces en caso de que el nonce cambie
        let lastError: Error | null = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            // Obtener nonce justo antes de crear la solicitud
            const nonce = await forwarder.getNonce(address);

            // Crear request
            const request: ForwardRequest = {
              from: address,
              to: CONTRACT_ADDRESSES.DAOVoting,
              value: 0n,
              gas: 200000n, // Más gas para crear propuesta
              nonce,
              data,
            };

            // Firmar con ethers.js usando EIP-712
            const signature = await signWithEthers(signer, request);

            // Enviar al relayer
            const txHash = await relayMetaTx(request, signature);
            console.log("✅ Meta-transacción enviada, hash:", txHash);
            
            // Esperar un poco para que la transacción se procese en la blockchain
            console.log("⏳ Esperando procesamiento de la transacción...");
            await new Promise((resolve) => setTimeout(resolve, 3000));
            
            // Invalidar y refetch queries para refrescar el listado
            console.log("🔄 Invalidando y refrescando queries de propuestas...");
            // Invalidar todas las queries que empiecen con "proposals"
            queryClient.invalidateQueries({ 
              queryKey: ["proposals"],
              exact: false 
            });
            // Forzar refetch inmediato
            await queryClient.refetchQueries({ 
              queryKey: ["proposals"],
              exact: false 
            });
            console.log("✅ Queries refrescadas");
            
            setGaslessSuccess(true);
            setGaslessPending(false);
            
            return;
          } catch (error: any) {
            lastError = error;
            if (error.message?.includes("Nonce no coincide") && attempt < 2) {
              await new Promise((resolve) => setTimeout(resolve, 500));
              continue;
            }
            setGaslessPending(false);
            throw error;
          }
        }
        setGaslessPending(false);
        throw lastError || new Error("Error al crear propuesta después de múltiples intentos");
      } catch (error: any) {
        setGaslessPending(false);
        throw error;
      }
    } else {
      // Si useGasless es false, usar transacción normal
      writeContract({
        address: CONTRACT_ADDRESSES.DAOVoting as `0x${string}`,
        abi: DAO_VOTING_ABI,
        functionName: "createProposal",
        args: [recipient as `0x${string}`, parseEther(amount), BigInt(deadline), description || ""],
      });
    }
  };

  // Invalidar y refetch queries cuando la transacción normal se completa
  useEffect(() => {
    if (isSuccess) {
      console.log("✅ Transacción normal completada, refrescando listado...");
      // Esperar un poco para que la transacción se procese
      const timer = setTimeout(() => {
        // Invalidar todas las queries relacionadas con propuestas
        queryClient.invalidateQueries({ 
          queryKey: ["proposals"],
          exact: false 
        });
        // Forzar refetch inmediato
        queryClient.refetchQueries({ 
          queryKey: ["proposals"],
          exact: false 
        });
        console.log("✅ Listado de propuestas refrescado");
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isSuccess, queryClient]);

  return {
    createProposal,
    hash,
    isPending: isPending || gaslessPending,
    isConfirming,
    isSuccess: isSuccess || gaslessSuccess,
    error,
  };
}

export function useVote() {
  const queryClient = useQueryClient();
  const { address, chainId } = useAccount();

  return useMutation({
    mutationFn: async ({ 
      proposalId, 
      voteType, 
      useGasless = true 
    }: { 
      proposalId: number; 
      voteType: VoteType;
      useGasless?: boolean;
    }) => {
      if (!address) throw new Error("Wallet no conectada");

      // Si useGasless es false, usar transacción normal
      if (!useGasless) {
        // Importar dinámicamente para evitar problemas de SSR
        const { ethers } = await import("ethers");
        const { getDAOContract } = await import("@/lib/contracts");
        const { CONTRACT_ADDRESSES } = await import("@/lib/config");
        const { getWalletClient } = await import("wagmi/actions");
        const { config } = await import("@/lib/config");
        const { RPC_URL } = await import("@/lib/config-server");

        const walletClient = await getWalletClient(config);
        if (!walletClient) throw new Error("Wallet no disponible");

        // Crear signer desde walletClient
        const provider = new ethers.BrowserProvider(walletClient as any);
        const signer = await provider.getSigner();
        const dao = getDAOContract(signer);

        // Enviar transacción normal
        const tx = await dao.vote(BigInt(proposalId), voteType);
        await tx.wait();

        return { txHash: tx.hash };
      }

      // Importar dinámicamente para evitar problemas de SSR
      const { ethers } = await import("ethers");
      const { relayMetaTx } = await import("@/lib/metaTx");
      const { signWithEthers } = await import("@/lib/signing");
      const { getForwarderContract, getDAOContract } = await import("@/lib/contracts");
      const { CONTRACT_ADDRESSES } = await import("@/lib/config");
      const { getWalletClient } = await import("wagmi/actions");
      const { config } = await import("@/lib/config");
      
      const walletClient = await getWalletClient(config);
      if (!walletClient) throw new Error("Wallet no disponible");

      // Crear signer desde walletClient
      const provider = new ethers.BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();

      // Obtener contratos
      const forwarder = getForwarderContract(signer);
      const dao = getDAOContract(signer);

      // Codificar la llamada a vote()
      const data = dao.interface.encodeFunctionData("vote", [BigInt(proposalId), voteType]);

      // Intentar hasta 3 veces en caso de que el nonce cambie
      let lastError: Error | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          // Obtener nonce justo antes de crear la solicitud (más reciente)
          const nonce = await forwarder.getNonce(address);
          
          console.log(`Intento ${attempt + 1}: Nonce obtenido:`, nonce.toString());

          // Crear request
          const request: ForwardRequest = {
            from: address,
            to: CONTRACT_ADDRESSES.DAOVoting,
            value: 0n,
            gas: 100000n,
            nonce,
            data,
          };

          // Firmar con ethers.js usando EIP-712
          const signature = await signWithEthers(signer, request);

          // Enviar al relayer
          const txHash = await relayMetaTx(request, signature);

          return { txHash };
        } catch (error: any) {
          lastError = error;
          // Si es error de nonce, esperar un poco y reintentar
          if (error.message?.includes("Nonce no coincide") && attempt < 2) {
            console.log(`Nonce no coincide, reintentando en 500ms...`);
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
          // Si es otro error o es el último intento, lanzar el error
          throw error;
        }
      }
      
      // Si llegamos aquí, todos los intentos fallaron
      throw lastError || new Error("Error al votar después de múltiples intentos");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      queryClient.invalidateQueries({ queryKey: ["proposal"] });
    },
  });
}

export function useUserVote(proposalId: number) {
  const { address } = useAccount();

  const { data } = useReadContract({
    address: CONTRACT_ADDRESSES.DAOVoting as `0x${string}`,
    abi: DAO_VOTING_ABI,
    functionName: "votes",
    args: address ? [BigInt(proposalId), address] : undefined,
    query: {
      enabled: !!address && proposalId > 0,
    },
  });

  return data !== undefined ? Number(data) : null;
}

export function useCanCreateProposal() {
  const { balance } = useUserBalance();
  const { totalBalance } = useTotalBalance();

  const userBalanceNum = parseFloat(balance);
  const totalBalanceNum = parseFloat(totalBalance);
  const minRequired = (totalBalanceNum * 10) / 100; // 10%

  return {
    canCreate: userBalanceNum >= minRequired && totalBalanceNum > 0,
    minRequired: minRequired.toString(),
    currentBalance: balance,
  };
}

