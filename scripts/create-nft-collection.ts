import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

const PRIVATE_KEY = process.env.PRIVATE_KEY || '';
const NFT_PACKAGE_ID = '0xc52379a8841aca72525a71e1ce30fc869b36a187adcb3b45f615fa753b9c6493';

async function createNFTCollection() {
  const keypair = Ed25519Keypair.fromSecretKey(Uint8Array.from(Buffer.from(PRIVATE_KEY, 'hex')));
  const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io' });
  
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${NFT_PACKAGE_ID}::nft::create_collection`,
    arguments: [
      tx.pure.string('Chat NFT Collection'),
      tx.pure.string('NFTs for Chat Messenger'),
      tx.pure.string('https://chat-messenger.app'),
      tx.pure.address(keypair.getPublicKey().toSuiAddress()),
    ],
  });
  
  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
      showObjectChanges: true,
    },
  });
  
  console.log('Transaction digest:', result.digest);
  
  const collectionObject = result.objectChanges?.find(
    (change: any) => change.type === 'created' && change.objectType.includes('::nft::NFTCollection')
  );
  
  if (collectionObject) {
    console.log('NFT Collection created:', collectionObject.objectId);
  }
  
  return result;
}

createNFTCollection().catch(console.error);
EOF < /dev/null