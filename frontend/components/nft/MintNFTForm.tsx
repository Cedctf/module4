'use client';

import { useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { MintNFTFormProps, NFTFormData } from '@/lib/types';
import { encodeToBCS, validateNFTFormData } from '@/lib/nftUtils';

export default function MintNFTForm({ packageId, onMintSuccess, onFetchNFTs }: MintNFTFormProps) {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  const [formData, setFormData] = useState<NFTFormData>({
    name: '',
    description: '',
    imageUrl: ''
  });
  const [loading, setLoading] = useState<boolean>(false);


  // Function to mint NFT
  const mintNFT = async () => {
    if (!currentAccount) {
      alert('Please connect your wallet first');
      return;
    }

    if (!validateNFTFormData(formData.name, formData.description, formData.imageUrl)) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      console.log('=== Mint NFT Debug ===');
      console.log('Name:', formData.name);
      console.log('Description:', formData.description);
      console.log('Image URL:', formData.imageUrl);
      
      const tx = new Transaction();

      // Encode strings to BCS format
      const nameBytes = encodeToBCS(formData.name);
      const descBytes = encodeToBCS(formData.description);
      const urlBytes = encodeToBCS(formData.imageUrl);

      console.log('Name BCS bytes:', nameBytes);
      console.log('Description BCS bytes:', descBytes);
      console.log('URL BCS bytes:', urlBytes);

      tx.moveCall({
        target: `${packageId}::nft::mint_to_sender`,
        arguments: [
          tx.pure(nameBytes), 
          tx.pure(descBytes),
          tx.pure(urlBytes),
        ],
      });
      
      console.log('Transaction created successfully');

      signAndExecuteTransaction(
        {
          transaction: tx,
        },
        {
          onSuccess: async (result) => {
            console.log('Transaction successful:', result);
            
            // Call parent handler
            await onMintSuccess(result.digest);
            
            // Clear form
            setFormData({
              name: '',
              description: '',
              imageUrl: ''
            });
            
            // Fetch user's NFTs
            await onFetchNFTs();
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            alert('Transaction failed: ' + error.message);
          },
        }
      );
    } catch (error) {
      console.error('Error minting NFT:', error);
      alert('Failed to mint NFT');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        Mint New NFT
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            NFT Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Cool Dragon #1"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe your NFT..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Image URL
          </label>
          <input
            type="url"
            value={formData.imageUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
            placeholder="https://example.com/image.jpg"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        {formData.imageUrl && (
          <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <img 
              src={formData.imageUrl} 
              alt="NFT Preview" 
              className="w-full h-48 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Invalid+Image+URL';
              }}
            />
          </div>
        )}
        
        <button
          onClick={mintNFT}
          disabled={loading || !currentAccount || !validateNFTFormData(formData.name, formData.description, formData.imageUrl)}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
        >
          {loading ? 'Minting...' : '🎨 Mint NFT'}
        </button>
        
        {!currentAccount && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Please connect your wallet first
          </p>
        )}
      </div>
    </div>
  );
}
