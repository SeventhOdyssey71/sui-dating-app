import { GAS_BUDGET } from './sui-config';

/**
 * Estimate gas budget based on transaction type and complexity
 */
export function estimateGasBudget(
  baseType: keyof typeof GAS_BUDGET,
  options?: {
    multiplier?: number;
    contentSize?: number;
    itemCount?: number;
  }
): number {
  const baseGas = GAS_BUDGET[baseType];
  const { multiplier = 1, contentSize = 0, itemCount = 1 } = options || {};
  
  // Add extra gas for larger content
  const contentGas = Math.floor(contentSize / 1000) * 1_000_000; // 1M MIST per KB
  
  // Add extra gas for multiple items
  const itemGas = itemCount > 1 ? (itemCount - 1) * 5_000_000 : 0;
  
  // Calculate total with safety buffer
  const totalGas = Math.floor((baseGas + contentGas + itemGas) * multiplier * 1.2);
  
  // Cap at reasonable maximum (1 SUI)
  return Math.min(totalGas, 1_000_000_000);
}

/**
 * Format gas amount for display
 */
export function formatGasAmount(mist: number): string {
  const sui = mist / 1_000_000_000;
  return `${sui.toFixed(4)} SUI`;
}