// NFT-related type definitions
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
