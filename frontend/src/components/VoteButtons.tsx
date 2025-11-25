"use client";

import { VoteType } from "@/lib/contracts";
import { useVote, useUserVote } from "@/hooks/useDAO";
import { useAccount } from "wagmi";
import { useState } from "react";

interface VoteButtonsProps {
  proposalId: number;
  isActive: boolean;
}

export function VoteButtons({ proposalId, isActive }: VoteButtonsProps) {
  const { address, isConnected } = useAccount();
  const userVote = useUserVote(proposalId);
  const voteMutation = useVote();
  const [selectedVote, setSelectedVote] = useState<VoteType | null>(null);
  const [useGasless, setUseGasless] = useState(true);

  const handleVote = async (voteType: VoteType) => {
    if (!isConnected) return;
    setSelectedVote(voteType);
    try {
      await voteMutation.mutateAsync({
        proposalId,
        voteType,
        useGasless,
      });
    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setSelectedVote(null);
    }
  };

  const getVoteButtonClass = (voteType: VoteType) => {
    const baseClass = "px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50";
    if (userVote === voteType) {
      return `${baseClass} bg-blue-600 text-white`;
    }
    if (selectedVote === voteType && voteMutation.isPending) {
      return `${baseClass} bg-gray-400 text-white`;
    }
    return `${baseClass} bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600`;
  };

  if (!isActive || !isConnected) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        {userVote !== null
          ? `Tu voto actual: ${
              userVote === VoteType.FOR
                ? "A FAVOR"
                : userVote === VoteType.AGAINST
                ? "EN CONTRA"
                : "ABSTENCIÓN"
            }`
          : "Vota en esta propuesta:"}
      </p>
      
      <div className="flex items-center mb-2">
        <input
          type="checkbox"
          id={`gasless-voting-${proposalId}`}
          checked={useGasless}
          onChange={(e) => setUseGasless(e.target.checked)}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
        />
        <label htmlFor={`gasless-voting-${proposalId}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
          Votación sin gas (relayer paga gas)
        </label>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleVote(VoteType.FOR)}
          disabled={voteMutation.isPending}
          className={getVoteButtonClass(VoteType.FOR)}
        >
          {selectedVote === VoteType.FOR && voteMutation.isPending
            ? "Votando..."
            : "A FAVOR"}
        </button>
        <button
          onClick={() => handleVote(VoteType.AGAINST)}
          disabled={voteMutation.isPending}
          className={getVoteButtonClass(VoteType.AGAINST)}
        >
          {selectedVote === VoteType.AGAINST && voteMutation.isPending
            ? "Votando..."
            : "EN CONTRA"}
        </button>
        <button
          onClick={() => handleVote(VoteType.ABSTAIN)}
          disabled={voteMutation.isPending}
          className={getVoteButtonClass(VoteType.ABSTAIN)}
        >
          {selectedVote === VoteType.ABSTAIN && voteMutation.isPending
            ? "Votando..."
            : "ABSTENCIÓN"}
        </button>
      </div>
      {voteMutation.isError && (
        <div className="text-red-600 dark:text-red-400 text-sm">
          Error al votar: {voteMutation.error?.message}
        </div>
      )}
    </div>
  );
}


