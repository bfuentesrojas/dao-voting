import { ethers } from "ethers";
import { CONTRACT_ADDRESSES } from "./config-server";

// ABI del MinimalForwarder
export const MINIMAL_FORWARDER_ABI = [
  "function getNonce(address from) view returns (uint256)",
  "function verify((address from, address to, uint256 value, uint256 gas, uint256 nonce, bytes data), bytes signature) view returns (bool)",
  "function execute((address from, address to, uint256 value, uint256 gas, uint256 nonce, bytes data), bytes signature) payable returns (bool, bytes)",
] as const;

// ABI del DAOVoting
export const DAO_VOTING_ABI = [
  {
    type: "function",
    name: "fundDao",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "createProposal",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "description", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "vote",
    stateMutability: "nonpayable",
    inputs: [
      { name: "proposalId", type: "uint256" },
      { name: "voteType", type: "uint8" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "executeProposal",
    stateMutability: "nonpayable",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "getProposal",
    stateMutability: "view",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "proposer", type: "address" },
          { name: "recipient", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "deadline", type: "uint256" },
          { name: "description", type: "string" },
          { name: "votesFor", type: "uint256" },
          { name: "votesAgainst", type: "uint256" },
          { name: "votesAbstain", type: "uint256" },
          { name: "executed", type: "bool" },
          { name: "executionTime", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getUserBalance",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "userBalances",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "totalBalance",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "proposalCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "proposals",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "proposer", type: "address" },
          { name: "recipient", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "deadline", type: "uint256" },
          { name: "description", type: "string" },
          { name: "votesFor", type: "uint256" },
          { name: "votesAgainst", type: "uint256" },
          { name: "votesAbstain", type: "uint256" },
          { name: "executed", type: "bool" },
          { name: "executionTime", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "votes",
    stateMutability: "view",
    inputs: [
      { name: "", type: "uint256" },
      { name: "", type: "address" },
    ],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "MIN_BALANCE_TO_VOTE",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "MIN_BALANCE_TO_PROPOSE_PERCENT",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "EXECUTION_DELAY",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "ProposalCreated",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: true },
      { name: "proposer", type: "address", indexed: true },
      { name: "recipient", type: "address", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
      { name: "deadline", type: "uint256", indexed: false },
      { name: "description", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "VoteCast",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: true },
      { name: "voter", type: "address", indexed: true },
      { name: "voteType", type: "uint8", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ProposalExecuted",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: true },
      { name: "recipient", type: "address", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "FundsDeposited",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;

// Tipos de voto
export enum VoteType {
  AGAINST = 0,
  FOR = 1,
  ABSTAIN = 2,
}

// Interfaz para propuesta
export interface Proposal {
  id: bigint;
  proposer: string;
  recipient: string;
  amount: bigint;
  deadline: bigint;
  description: string;
  votesFor: bigint;
  votesAgainst: bigint;
  votesAbstain: bigint;
  executed: boolean;
  executionTime: bigint;
}

// Helpers para obtener contratos
export function getDAOContract(provider: ethers.Provider | ethers.Signer) {
  if (!CONTRACT_ADDRESSES.DAOVoting) {
    throw new Error("DAO contract address not configured");
  }
  return new ethers.Contract(
    CONTRACT_ADDRESSES.DAOVoting,
    DAO_VOTING_ABI,
    provider
  );
}

export function getForwarderContract(provider: ethers.Provider | ethers.Signer) {
  if (!CONTRACT_ADDRESSES.MinimalForwarder) {
    throw new Error("Forwarder contract address not configured");
  }
  return new ethers.Contract(
    CONTRACT_ADDRESSES.MinimalForwarder,
    MINIMAL_FORWARDER_ABI,
    provider
  );
}


