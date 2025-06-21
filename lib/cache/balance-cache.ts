import { suiClient } from '@/lib/sui-client';
import { blockchainCache, CACHE_KEYS } from './blockchain-cache';

export async function getCachedBalance(address: string): Promise<bigint> {
  return await blockchainCache.getOrFetch(
    CACHE_KEYS.USER_BALANCE(address),
    async () => {
      const balance = await suiClient.getBalance({
        owner: address,
      });
      return BigInt(balance.totalBalance);
    },
    15000 // Cache for 15 seconds
  );
}

export function clearBalanceCache(address: string): void {
  blockchainCache.clear(CACHE_KEYS.USER_BALANCE(address));
}