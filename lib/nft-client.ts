import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { getSuiRpcUrl } from './sui-config';
import { blockchainCache, CACHE_KEYS } from './cache/blockchain-cache';

const NFT_PACKAGE_ID = process.env.NEXT_PUBLIC_NFT_PACKAGE_ID || '0x0';
const NFT_COLLECTION_ID = process.env.NEXT_PUBLIC_NFT_COLLECTION_ID || '0x0';

export const nftClient = new SuiClient({ url: getSuiRpcUrl() });

export interface NFT {
  id: string;
  name: string;
  description: string;
  url: string;
  creator: string;
  collection: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

export interface MintNFTParams {
  name: string;
  description: string;
  url: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  recipient: string;
  minterKeypair: Ed25519Keypair;
}

export interface TransferNFTParams {
  nftId: string;
  recipient: string;
  senderKeypair: Ed25519Keypair;
}

// Get user's NFTs
export async function getUserNFTs(address: string): Promise<NFT[]> {
  try {
    // Use cache with getOrFetch
    const cacheKey = CACHE_KEYS.USER_NFTS(address);
    
    return await blockchainCache.getOrFetch(
      cacheKey,
      async () => {
        const objects = await nftClient.getOwnedObjects({
          owner: address,
          filter: {
            StructType: `${NFT_PACKAGE_ID}::nft::DiscoveerNFT`,
          },
          options: {
            showContent: true,
            showDisplay: true,
          },
        });

        const nfts: NFT[] = [];

        for (const obj of objects.data) {
          if (obj.data?.content?.dataType === 'moveObject') {
            const fields = obj.data.content.fields as any;
            const display = obj.data.display?.data;
            
            nfts.push({
              id: obj.data.objectId,
              name: display?.name || fields.name,
              description: display?.description || fields.description,
              url: display?.image_url || fields.url,
              creator: display?.creator || fields.creator,
              collection: display?.collection || fields.collection,
              attributes: fields.attributes || [],
            });
          }
        }

        return nfts;
      },
      60000 // Cache for 1 minute
    );
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return [];
  }
}

// Mint a new NFT
export async function mintNFT({
  name,
  description,
  url,
  attributes,
  recipient,
  minterKeypair,
}: MintNFTParams) {
  const tx = new Transaction();

  if (attributes && attributes.length > 0) {
    const trait_types = attributes.map(attr => Array.from(new TextEncoder().encode(attr.trait_type)));
    const values = attributes.map(attr => Array.from(new TextEncoder().encode(attr.value)));

    tx.moveCall({
      target: `${NFT_PACKAGE_ID}::nft::mint_nft_with_attributes`,
      arguments: [
        tx.object(NFT_COLLECTION_ID),
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
      target: `${NFT_PACKAGE_ID}::nft::mint_nft`,
      arguments: [
        tx.object(NFT_COLLECTION_ID),
        tx.pure(Array.from(new TextEncoder().encode(name))),
        tx.pure(Array.from(new TextEncoder().encode(description))),
        tx.pure(Array.from(new TextEncoder().encode(url))),
        tx.pure.address(recipient),
      ],
    });
  }

  const result = await nftClient.signAndExecuteTransaction({
    signer: minterKeypair,
    transactionBlock: tx,
    options: {
      showEffects: true,
      showEvents: true,
    },
  });

  return result;
}

// Transfer NFT
export async function transferNFT({
  nftId,
  recipient,
  senderKeypair,
}: TransferNFTParams) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${NFT_PACKAGE_ID}::nft::transfer_nft`,
    arguments: [
      tx.object(nftId),
      tx.pure.address(recipient),
    ],
  });

  const result = await nftClient.signAndExecuteTransaction({
    signer: senderKeypair,
    transactionBlock: tx,
    options: {
      showEffects: true,
      showEvents: true,
    },
  });

  // Clear NFT cache for both sender and recipient
  const senderAddress = senderKeypair.getPublicKey().toSuiAddress();
  blockchainCache.clear(CACHE_KEYS.USER_NFTS(senderAddress));
  blockchainCache.clear(CACHE_KEYS.USER_NFTS(recipient));

  return result;
}

// Batch transfer NFTs
export async function batchTransferNFTs(
  nftIds: string[],
  recipient: string,
  senderKeypair: Ed25519Keypair
) {
  const tx = new Transaction();

  // Create vector of NFT objects
  const nftObjects = nftIds.map(id => tx.object(id));

  tx.moveCall({
    target: `${NFT_PACKAGE_ID}::nft::batch_transfer_nfts`,
    arguments: [
      tx.makeMoveVec({ objects: nftObjects }),
      tx.pure.address(recipient),
    ],
  });

  const result = await nftClient.signAndExecuteTransaction({
    signer: senderKeypair,
    transactionBlock: tx,
    options: {
      showEffects: true,
      showEvents: true,
    },
  });

  // Clear NFT cache for both sender and recipient
  const senderAddress = senderKeypair.getPublicKey().toSuiAddress();
  blockchainCache.clear(CACHE_KEYS.USER_NFTS(senderAddress));
  blockchainCache.clear(CACHE_KEYS.USER_NFTS(recipient));

  return result;
}

// Get collection info
export async function getCollectionInfo() {
  try {
    const collection = await nftClient.getObject({
      id: NFT_COLLECTION_ID,
      options: {
        showContent: true,
      },
    });

    if (collection.data?.content?.dataType === 'moveObject') {
      const fields = collection.data.content.fields as any;
      return {
        name: fields.name,
        creator: fields.creator,
        minted: parseInt(fields.minted),
        maxSupply: parseInt(fields.max_supply),
      };
    }
  } catch (error) {
    console.error('Error fetching collection info:', error);
  }

  return null;
}