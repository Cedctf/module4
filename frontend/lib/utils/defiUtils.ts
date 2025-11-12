import { SuiClient, SuiObjectResponse } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { DeFiPoolData, DeFiTransactionParams } from '../types';
import { DEFI_PACKAGE_ID, DEFI_POOL_ID } from '../config';

// Constants for conversion
export const SUI_TO_MIST = 1_000_000_000;
export const MIST_TO_SUI = 1 / SUI_TO_MIST;

// Utility function to convert SUI to MIST
export const suiToMist = (suiAmount: string | number): number => {
  return Math.floor(Number(suiAmount) * SUI_TO_MIST);
};

// Utility function to convert MIST to SUI
export const mistToSui = (mistAmount: string | number): string => {
  return (Number(mistAmount) * MIST_TO_SUI).toFixed(4);
};

// Function to fetch pool data and user balance
export const fetchPoolData = async (
  suiClient: SuiClient,
  userAddress: string,
  poolId: string = DEFI_POOL_ID
): Promise<DeFiPoolData> => {
  try {
    // Get pool balance
    const poolObject: SuiObjectResponse = await suiClient.getObject({
      id: poolId,
      options: { showContent: true },
    });

    let poolBalance = '0';
    if (poolObject.data?.content?.dataType === 'moveObject') {
      const fields = poolObject.data.content.fields as any;
      const balance = fields.deposits || '0';
      poolBalance = mistToSui(balance);
    }

    // Get user's SUI balance
    const coins = await suiClient.getBalance({
      owner: userAddress,
      coinType: '0x2::sui::SUI',
    });
    const userBalance = mistToSui(coins.totalBalance);

    // Get user's debt by calling the view function
    let userDebt = '0';
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${DEFI_PACKAGE_ID}::defi::get_debt`,
        arguments: [
          tx.object(poolId),
          tx.pure.address(userAddress)
        ],
      });

      const debtResult = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: userAddress
      });

      if (debtResult.results && debtResult.results[0] && debtResult.results[0].returnValues) {
        const debtBytes = debtResult.results[0].returnValues[0][0];
        // Parse the BCS-encoded u64 value
        const debtInMist = new DataView(new Uint8Array(debtBytes).buffer).getBigUint64(0, true);
        userDebt = mistToSui(Number(debtInMist));
      }
    } catch (error) {
      console.warn('Failed to fetch user debt:', error);
      // Keep userDebt as '0' if the call fails
    }

    return {
      poolBalance,
      userBalance,
      userDebt,
    };
  } catch (error) {
    console.error('Error fetching pool data:', error);
    return {
      poolBalance: '0',
      userBalance: '0',
      userDebt: '0',
    };
  }
};

// Function to create deposit transaction
export const createDepositTransaction = (params: DeFiTransactionParams): Transaction => {
  const tx = new Transaction();
  const amountInMist = suiToMist(params.amount);
  
  const [coin] = tx.splitCoins(tx.gas, [amountInMist]);

  tx.moveCall({
    target: `${params.packageId}::defi::deposit`,
    arguments: [
      tx.object(params.poolId),
      coin,
    ],
  });

  return tx;
};

// Function to create borrow transaction
export const createBorrowTransaction = (params: DeFiTransactionParams): Transaction => {
  const tx = new Transaction();
  const amountInMist = suiToMist(params.amount);

  tx.moveCall({
    target: `${params.packageId}::defi::borrow`,
    arguments: [
      tx.object(params.poolId),
      tx.pure.u64(amountInMist),
    ],
  });

  return tx;
};

// Function to create repay transaction
export const createRepayTransaction = (params: DeFiTransactionParams): Transaction => {
  const tx = new Transaction();
  const amountInMist = suiToMist(params.amount);
  
  const [coin] = tx.splitCoins(tx.gas, [amountInMist]);

  tx.moveCall({
    target: `${params.packageId}::defi::repay`,
    arguments: [
      tx.object(params.poolId),
      coin,
    ],
  });

  return tx;
};

// Function to validate transaction amount
export const validateAmount = (amount: string): boolean => {
  const numAmount = Number(amount);
  return amount.trim() !== '' && numAmount > 0 && !isNaN(numAmount);
};

// Function to generate explorer URL for transactions
export const getExplorerUrl = (txDigest: string): string => {
  return `https://testnet.suivision.xyz/txblock/${txDigest}`;
};

// Function to handle transaction success
export const handleTransactionSuccess = (
  result: any,
  actionType: 'deposit' | 'borrow' | 'repay',
  setTxDigest: (digest: string) => void,
  onRefresh?: () => Promise<void>
) => {
  console.log(`${actionType} successful:`, result);
  setTxDigest(result.digest);
  
  const actionMessages = {
    deposit: 'Deposit successful!',
    borrow: 'Borrow successful!',
    repay: 'Repay successful!'
  };
  
  alert(`${actionMessages[actionType]} Tx: ${result.digest}`);
  
  if (onRefresh) {
    onRefresh();
  }
};

// Function to handle transaction error
export const handleTransactionError = (
  error: any,
  actionType: 'deposit' | 'borrow' | 'repay'
) => {
  console.error(`${actionType} failed:`, error);
  
  const actionMessages = {
    deposit: 'Deposit failed',
    borrow: 'Borrow failed',
    repay: 'Repay failed'
  };
  
  alert(`${actionMessages[actionType]}: ${error.message}`);
};
