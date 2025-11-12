'use client';

import { useState, useEffect } from 'react';
import { 
  useCurrentAccount, 
  useSuiClient 
} from '@mysten/dapp-kit';
import { ConnectButton } from '@mysten/dapp-kit';
import Link from 'next/link';
import MintNFTForm from '@/components/nft/MintNFTForm';
import UserNFTList from '@/components/nft/UserNFTList';
import NFTMintedEvents from '@/components/nft/NFTMintedEvents';
import { ParsedNFTEvent } from '@/lib/types/nft';
import { SuiObjectResponse } from '@mysten/sui/client';
import { parseNFTMintedEvents, queryAllNFTMintedEvents, fetchUserNFTs } from '@/lib/utils/nft';
import { PACKAGE_ID } from '@/lib/config/nft';

export default function NFTPage() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  
  const [loading, setLoading] = useState<boolean>(false);
  const [txDigest, setTxDigest] = useState<string>('');
  const [mintedNFTs, setMintedNFTs] = useState<SuiObjectResponse[]>([]);
  const [mintedEvents, setMintedEvents] = useState<ParsedNFTEvent[]>([]);


  // Function to query all historical NFTMinted events from the contract
  const handleQueryAllNFTMintedEvents = async () => {
    try {
      setLoading(true);
      const events = await queryAllNFTMintedEvents(suiClient, PACKAGE_ID);
      setMintedEvents(events);
      return events;
    } catch (error) {
      console.error('Error querying all NFT minted events:', error);
      alert('Failed to query events: ' + (error as Error).message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Load all historical events on component mount
  useEffect(() => {
    handleQueryAllNFTMintedEvents();
  }, []); // Run once on mount

  // Handler for successful mint - to be passed to MintNFTForm
  const handleMintSuccess = async (digest: string) => {
    setTxDigest(digest);
    
    // Parse and index the NFTMinted events from this transaction
    const events = await parseNFTMintedEvents(suiClient, digest);
    
    if (events.length > 0) {
      // Add the new events to the beginning of the list (newest first)
      setMintedEvents(prev => [...events, ...prev]);
      alert(`NFT Minted! Object ID: ${events[0].objectId}`);
    } else {
      alert(`NFT Minted! Tx Digest: ${digest}`);
    }
  };

  // Wrapper function for refreshing events - to match component prop type
  const handleRefreshEvents = async () => {
    await handleQueryAllNFTMintedEvents();
  };

  // Function to fetch user's NFTs
  const handleFetchUserNFTs = async () => {
    if (!currentAccount) return;

    try {
      setLoading(true);
      const nfts = await fetchUserNFTs(suiClient, currentAccount.address, PACKAGE_ID);
      setMintedNFTs(nfts);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                ← Home
              </Link>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                NFT Minting Platform
              </h1>
            </div>
            <ConnectButton />
          </div>
          
          {currentAccount && (
            <div className="mt-4 p-3 bg-purple-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-semibold">Connected Address:</span>{' '}
                <span className="font-mono text-xs break-all">
                  {currentAccount.address}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Contract Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Contract Information
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex flex-col">
              <span className="font-semibold text-gray-600 dark:text-gray-400">Package ID:</span>
              <span className="font-mono text-xs break-all text-gray-800 dark:text-gray-200">
                {PACKAGE_ID}
              </span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Mint NFT Form Component */}
          <MintNFTForm
            packageId={PACKAGE_ID}
            onMintSuccess={handleMintSuccess}
            onFetchNFTs={handleFetchUserNFTs}
          />

          {/* Your NFTs Component */}
          <UserNFTList
            nfts={mintedNFTs}
            loading={loading}
            onRefresh={handleFetchUserNFTs}
          />
        </div>

        {/* Transaction Result */}
        {txDigest && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Last Transaction
            </h2>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Transaction Digest:
              </p>
              <p className="font-mono text-xs break-all text-gray-800 dark:text-gray-200 mb-3">
                {txDigest}
              </p>
              <a
                href={`https://testnet.suivision.xyz/txblock/${txDigest}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded transition-colors duration-200"
              >
                View on Explorer →
              </a>
            </div>
          </div>
        )}

        {/* NFT Minted Events Component */}
        <NFTMintedEvents
          events={mintedEvents}
          loading={loading}
          onRefresh={handleRefreshEvents}
        />
      </div>
    </div>
  );
}

