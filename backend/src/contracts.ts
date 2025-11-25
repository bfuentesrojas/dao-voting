import { ethers } from "ethers";

// ABI simplificado para el daemon
export const DAO_VOTING_ABI = [
  "function proposalCount() view returns (uint256)",
  "function getProposal(uint256 proposalId) view returns (tuple(uint256 id, address proposer, address recipient, uint256 amount, uint256 deadline, uint256 votesFor, uint256 votesAgainst, uint256 votesAbstain, bool executed, uint256 executionTime))",
  "function executeProposal(uint256 proposalId)",
  "function EXECUTION_DELAY() view returns (uint256)",
] as const;

export function getDAOContract(provider: ethers.Provider | ethers.Signer, address: string) {
  return new ethers.Contract(address, DAO_VOTING_ABI, provider);
}




