// Type definitions for NFT and DeFi functionality
import { SuiObjectResponse } from '@mysten/sui/client';

export interface NFTMintedEvent {
  objectId: string;
  creator: string;
  name: string;
  timestamp: string;
  txDigest: string;
  eventSeq?: number;
}

export interface NFTMintedEventsProps {
  events: NFTMintedEvent[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

export interface MintNFTFormProps {
  packageId: string;
  onMintSuccess: (digest: string) => Promise<void>;
  onFetchNFTs: () => Promise<void>;
}

export interface UserNFTListProps {
  nfts: SuiObjectResponse[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

export interface NFTFormData {
  name: string;
  description: string;
  imageUrl: string;
}

export interface ParsedNFTEvent {
  objectId: string;
  creator: string;
  name: string;
  timestamp: string;
  txDigest: string;
  eventSeq?: number;
}

// DeFi-related type definitions

export interface DeFiPoolData {
  poolBalance: string;
  userBalance: string;
  userDebt: string;
}

export interface DeFiTransactionParams {
  amount: string;
  packageId: string;
  poolId: string;
}

export interface DeFiFormState {
  depositAmount: string;
  borrowAmount: string;
  repayAmount: string;
  loading: boolean;
  txDigest: string;
}

