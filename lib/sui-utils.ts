import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromBase64 } from '@mysten/bcs';

// Note: This is a temporary solution for API routes
// In production, transactions should be signed on the client side
export function getKeypairFromPrivateKey(privateKey: string): Ed25519Keypair {
  try {
    return Ed25519Keypair.fromSecretKey(fromBase64(privateKey));
  } catch (error) {
    throw new Error('Invalid private key format');
  }
}