'use client';

import { useState, useEffect } from 'react';
import { 
  useCurrentAccount, 
  useSignAndExecuteTransaction,
  useSuiClient 
} from '@mysten/dapp-kit';
import { ConnectButton } from '@mysten/dapp-kit';
import Link from 'next/link';
import { DeFiPoolData, DeFiFormState } from '@/lib/types';
import { 
  fetchPoolData,
  createDepositTransaction,
  createBorrowTransaction,
  createRepayTransaction,
  validateAmount,
  getExplorerUrl,
  handleTransactionSuccess,
  handleTransactionError
} from '@/lib/defiUtils';
import { DEFI_PACKAGE_ID, DEFI_POOL_ID } from '@/lib/config';

export default function DeFiPage() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  const [formState, setFormState] = useState<DeFiFormState>({
    depositAmount: '',
    borrowAmount: '',
    repayAmount: '',
    loading: false,
    txDigest: ''
  });
  const [poolData, setPoolData] = useState<DeFiPoolData>({
    poolBalance: '0',
    userDebt: '0',
    userBalance: '0'
  });

  // Fetch pool balance and user debt
  const refreshPoolData = async () => {
    if (!currentAccount) return;

    try {
      const data = await fetchPoolData(suiClient, currentAccount.address, DEFI_POOL_ID);
      setPoolData(data);
    } catch (error) {
      console.error('Error fetching pool data:', error);
    }
  };

  useEffect(() => {
    if (currentAccount) {
      refreshPoolData();
    }
  }, [currentAccount]);

  // Function to deposit SUI
  const handleDeposit = async () => {
    if (!currentAccount) {
      alert('Please connect your wallet first');
      return;
    }

    if (!validateAmount(formState.depositAmount)) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setFormState(prev => ({ ...prev, loading: true }));
      
      const tx = createDepositTransaction({
        amount: formState.depositAmount,
        packageId: DEFI_PACKAGE_ID,
        poolId: DEFI_POOL_ID
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            handleTransactionSuccess(result, 'deposit', 
              (digest) => setFormState(prev => ({ ...prev, txDigest: digest })),
              refreshPoolData
            );
            setFormState(prev => ({ ...prev, depositAmount: '' }));
          },
          onError: (error) => {
            handleTransactionError(error, 'deposit');
          },
        }
      );
    } catch (error) {
      console.error('Error depositing:', error);
      alert('Failed to deposit');
    } finally {
      setFormState(prev => ({ ...prev, loading: false }));
    }
  };

  // Function to borrow SUI
  const handleBorrow = async () => {
    if (!currentAccount) {
      alert('Please connect your wallet first');
      return;
    }

    if (!validateAmount(formState.borrowAmount)) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setFormState(prev => ({ ...prev, loading: true }));
      
      const tx = createBorrowTransaction({
        amount: formState.borrowAmount,
        packageId: DEFI_PACKAGE_ID,
        poolId: DEFI_POOL_ID
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            handleTransactionSuccess(result, 'borrow',
              (digest) => setFormState(prev => ({ ...prev, txDigest: digest })),
              refreshPoolData
            );
            setFormState(prev => ({ ...prev, borrowAmount: '' }));
          },
          onError: (error) => {
            handleTransactionError(error, 'borrow');
          },
        }
      );
    } catch (error) {
      console.error('Error borrowing:', error);
      alert('Failed to borrow');
    } finally {
      setFormState(prev => ({ ...prev, loading: false }));
    }
  };

  // Function to repay SUI
  const handleRepay = async () => {
    if (!currentAccount) {
      alert('Please connect your wallet first');
      return;
    }

    if (!validateAmount(formState.repayAmount)) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setFormState(prev => ({ ...prev, loading: true }));
      
      const tx = createRepayTransaction({
        amount: formState.repayAmount,
        packageId: DEFI_PACKAGE_ID,
        poolId: DEFI_POOL_ID
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            handleTransactionSuccess(result, 'repay',
              (digest) => setFormState(prev => ({ ...prev, txDigest: digest })),
              refreshPoolData
            );
            setFormState(prev => ({ ...prev, repayAmount: '' }));
          },
          onError: (error) => {
            handleTransactionError(error, 'repay');
          },
        }
      );
    } catch (error) {
      console.error('Error repaying:', error);
      alert('Failed to repay');
    } finally {
      setFormState(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
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
                DeFi Platform
              </h1>
            </div>
            <ConnectButton />
          </div>
          
          {currentAccount && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-gray-700 rounded-lg">
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
                {DEFI_PACKAGE_ID}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-gray-600 dark:text-gray-400">Pool ID:</span>
              <span className="font-mono text-xs break-all text-gray-800 dark:text-gray-200">
                {DEFI_POOL_ID}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Pool Balance
            </h3>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {poolData.poolBalance} SUI
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Your Balance
            </h3>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {poolData.userBalance} SUI
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Your Debt
            </h3>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {poolData.userDebt} SUI
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Deposit */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              💰 Deposit
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (SUI)
                </label>
                <input
                  type="number"
                  value={formState.depositAmount}
                  onChange={(e) => setFormState(prev => ({ ...prev, depositAmount: e.target.value }))}
                  placeholder="0.0"
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <button
                onClick={handleDeposit}
                disabled={formState.loading || !currentAccount || !formState.depositAmount}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                {formState.loading ? 'Processing...' : 'Deposit'}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Deposit SUI into the pool to provide liquidity
              </p>
            </div>
          </div>

          {/* Borrow */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              📤 Borrow
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (SUI)
                </label>
                <input
                  type="number"
                  value={formState.borrowAmount}
                  onChange={(e) => setFormState(prev => ({ ...prev, borrowAmount: e.target.value }))}
                  placeholder="0.0"
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <button
                onClick={handleBorrow}
                disabled={formState.loading || !currentAccount || !formState.borrowAmount}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                {formState.loading ? 'Processing...' : 'Borrow'}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Borrow SUI from the pool (requires sufficient liquidity)
              </p>
            </div>
          </div>

          {/* Repay */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              📥 Repay
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (SUI)
                </label>
                <input
                  type="number"
                  value={formState.repayAmount}
                  onChange={(e) => setFormState(prev => ({ ...prev, repayAmount: e.target.value }))}
                  placeholder="0.0"
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <button
                onClick={handleRepay}
                disabled={formState.loading || !currentAccount || !formState.repayAmount}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                {formState.loading ? 'Processing...' : 'Repay'}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Repay your borrowed SUI
              </p>
            </div>
          </div>
        </div>

        {/* Transaction Result */}
        {formState.txDigest && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Last Transaction
            </h2>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Transaction Digest:
              </p>
              <p className="font-mono text-xs break-all text-gray-800 dark:text-gray-200 mb-3">
                {formState.txDigest}
              </p>
              <a
                href={getExplorerUrl(formState.txDigest)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded transition-colors duration-200"
              >
                View on Explorer →
              </a>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            How to Use
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Deploy your DeFi contract and update PACKAGE_ID and POOL_ID above</li>
            <li>Connect your wallet</li>
            <li><strong>Deposit:</strong> Add SUI to the pool to provide liquidity</li>
            <li><strong>Borrow:</strong> Take out a loan (tracked as debt)</li>
            <li><strong>Repay:</strong> Pay back your borrowed amount</li>
          </ol>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Note:</strong> This is a simple DeFi contract with no collateral requirements. 
              You can borrow as long as the pool has sufficient SUI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
