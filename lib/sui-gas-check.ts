import { suiClient } from './sui-client';

export async function checkGasPrice(): Promise<bigint> {
  try {
    const gasPrice = await suiClient.getReferenceGasPrice();
    console.log('Current gas price:', gasPrice, 'MIST');
    return gasPrice;
  } catch (error) {
    console.error('Failed to get gas price:', error);
    return BigInt(1000); // Default to 1000 MIST
  }
}

export async function estimateTransactionGas(
  transaction: any,
  sender: string
): Promise<number> {
  try {
    // Try to dry run the transaction to get actual gas estimate
    const dryRun = await suiClient.dryRunTransactionBlock({
      transactionBlock: await transaction.build({ client: suiClient }),
    });
    
    const gasUsed = dryRun.effects.gasUsed;
    const totalGas = Number(gasUsed.computationCost) + Number(gasUsed.storageCost) - Number(gasUsed.storageRebate);
    
    // Add 50% buffer for safety
    return Math.ceil(totalGas * 1.5);
  } catch (error) {
    console.error('Failed to estimate gas:', error);
    // Return a safe default
    return 50_000_000; // 0.05 SUI
  }
}