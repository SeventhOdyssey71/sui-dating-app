import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { GAS_BUDGET } from '@/lib/sui-config';

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
          tx.pure(Array.from(new TextEncoder().encode(name))),
          tx.pure(Array.from(new TextEncoder().encode(description))),
          tx.pure(Array.from(new TextEncoder().encode(url))),
          tx.pure(trait_types),
          tx.pure(values),
          tx.pure.address(recipient),
        ],
      });
    } else {
      tx.moveCall({
        target: `${process.env.NEXT_PUBLIC_NFT_PACKAGE_ID}::nft::mint_nft`,
        arguments: [
          tx.object(process.env.NEXT_PUBLIC_NFT_COLLECTION_ID!),
          tx.pure(Array.from(new TextEncoder().encode(name))),
          tx.pure(Array.from(new TextEncoder().encode(description))),
          tx.pure(Array.from(new TextEncoder().encode(url))),
          tx.pure.address(recipient),
        ],
      });
    }

    signAndExecute(
      {
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
      },
      {
        onSuccess: (result) => {
          console.log('NFT minted successfully:', result);
          
          // Find the created NFT object
          const createdObjects = result.objectChanges?.filter(
            (change: any) => change.type === 'created'
          ) || [];
          
          if (createdObjects.length > 0) {
            const nftObject = createdObjects.find((obj: any) => 
              obj.objectType.includes('::nft::DiscoveerNFT')
            );
            
            if (nftObject) {
              onSuccess?.({ ...result, nftId: nftObject.objectId });
              return;
            }
          }
          
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