"use client";

import { ConnectWallet } from "@/components/ConnectWallet";
import { FundingPanel } from "@/components/FundingPanel";
import { CreateProposal } from "@/components/CreateProposal";
import { ProposalList } from "@/components/ProposalList";
import { IntegrationTest } from "@/components/IntegrationTest";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <header className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              DAO Voting
            </h1>
            <ConnectWallet />
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Sistema de gobernanza descentralizada con votación sin gas
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <FundingPanel />
          <CreateProposal />
        </div>

        {process.env.NEXT_PUBLIC_ENABLE_INTEGRATION_TEST === "true" && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Prueba Integrada</h2>
            <IntegrationTest />
          </section>
        )}

        <section>
          <h2 className="text-2xl font-bold mb-4">Propuestas</h2>
          <ProposalList />
        </section>
      </div>
    </main>
  );
}
