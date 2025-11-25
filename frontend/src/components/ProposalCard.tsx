"use client";

import { Proposal } from "@/lib/contracts";
import { formatAddress, formatETH, formatDate, getProposalStatus } from "@/lib/utils";
import { VoteButtons } from "./VoteButtons";

interface ProposalCardProps {
  proposal: Proposal;
}

export function ProposalCard({ proposal }: ProposalCardProps) {
  const status = getProposalStatus(proposal);

  const now = Math.floor(Date.now() / 1000);
  const isActive = Number(proposal.deadline) > now && !proposal.executed;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">Propuesta #{proposal.id.toString()}</h3>
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm text-white ${status.color}`}
          >
            {status.label}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div>
          <span className="text-gray-600 dark:text-gray-400">Beneficiario: </span>
          <span className="font-mono">{formatAddress(proposal.recipient)}</span>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Monto: </span>
          <span className="font-semibold">{formatETH(proposal.amount)}</span>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Fecha límite: </span>
          <span>{formatDate(proposal.deadline)}</span>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Proponente: </span>
          <span className="font-mono">{formatAddress(proposal.proposer)}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {proposal.votesFor.toString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">A FAVOR</div>
        </div>
        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {proposal.votesAgainst.toString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">EN CONTRA</div>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {proposal.votesAbstain.toString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">ABSTENCIÓN</div>
        </div>
      </div>

      <VoteButtons proposalId={Number(proposal.id)} isActive={isActive} />
    </div>
  );
}
