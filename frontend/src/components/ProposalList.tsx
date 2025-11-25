"use client";

import React from "react";
import { useProposals } from "@/hooks/useDAO";
import { ProposalCard } from "./ProposalCard";

export function ProposalList() {
  const { data: proposals, isLoading, error, refetch } = useProposals();
  
  // Log para debugging
  React.useEffect(() => {
    console.log("📋 ProposalList - Propuestas:", proposals?.length || 0, proposals);
  }, [proposals]);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando propuestas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">
          Error al cargar propuestas: {error.message}
        </p>
      </div>
    );
  }

  if (!proposals || proposals.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">
          No hay propuestas aún. ¡Sé el primero en crear una!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {proposals.map((proposal: any) => (
        <ProposalCard key={proposal.id.toString()} proposal={proposal} />
      ))}
    </div>
  );
}



