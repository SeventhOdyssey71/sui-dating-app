import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { GAS_BUDGET } from '@/lib/sui-config';

// @ts-ignore - Transaction type conflict between versions
const { Transaction } = require('@mysten/sui/transactions');

export function useNFTTransactions() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const mintNFT = async (
    name: string,
    description: string,
    url: string,
    attributes: Array<{ trait_type: string; value: string }>,
    recipient: string,
    onSuccess?: (result: any) => void,
    onError?: (error: any) => void
  ) => {
    const tx = new Transaction();
    
    // Set gas budget
    tx.setGasBudget(GAS_BUDGET.NFT_MINT);

    if (attributes && attributes.length > 0) {
      const trait_types = attributes.map(attr => Array.from(new TextEncoder().encode(attr.trait_type)));
      const values = attributes.map(attr => Array.from(new TextEncoder().encode(attr.value)));

      tx.moveCall({
        target: `${process.env.NEXT_PUBLIC_NFT_PACKAGE_ID}::nft::mint_nft_with_attributes`,
        arguments: [
          tx.object(process.env.NEXT_PUBLIC_NFT_COLLECTION_ID!),
          tx.pure(Array.from(new TextEncoder().encode(name)), 'vector<u8>'),
          tx.pure(Array.from(new TextEncoder().encode(description)), 'vector<u8>'),
          tx.pure(Array.from(new TextEncoder().encode(url)), 'vector<u8>'),
          tx.pure(trait_types, 'vector<vector<u8>>'),
          tx.pure(values, 'vector<vector<u8>>'),
          tx.pure.address(recipient),
        ],
      });
    } else {
      tx.moveCall({
        target: `${process.env.NEXT_PUBLIC_NFT_PACKAGE_ID}::nft::mint_nft`,
        arguments: [
          tx.object(process.env.NEXT_PUBLIC_NFT_COLLECTION_ID!),
          tx.pure(Array.from(new TextEncoder().encode(name)), 'vector<u8>'),
          tx.pure(Array.from(new TextEncoder().encode(description)), 'vector<u8>'),
          tx.pure(Array.from(new TextEncoder().encode(url)), 'vector<u8>'),
          tx.pure.address(recipient),
        ],
      });
    }

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: (result) => {
          console.log('NFT minted successfully:', result);
          // With dapp-kit, object changes are not directly available
          // You would need to query them separately if needed
          onSuccess?.(result);
        },
        onError: (error) => {
          console.error('Failed to mint NFT:', error);
          if (error.message?.toLowerCase().includes('gas') || error.message?.toLowerCase().includes('budget')) {
            onError?.(new Error('Transaction failed due to insufficient gas budget. Please try again.'));
          } else {
            onError?.(error);
          }
        },
      }
    );
  };

  return {
    mintNFT,
  };
}