// Sui contract configuration
// Update these values after deploying your contract to testnet

export const SUI_CONTRACTS = {
  packageId: (process.env.NEXT_PUBLIC_MESSAGE_PACKAGE_ID || process.env.NEXT_PUBLIC_PACKAGE_ID || '0x0').trim(),
  messageHubId: (process.env.NEXT_PUBLIC_MESSAGE_HUB_ID || '0x0').trim(),
  network: (process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet').trim(),
} as const;

// Debug logging
if (typeof window !== 'undefined') {
  console.log('SUI_CONTRACTS loaded:', SUI_CONTRACTS);
  console.log('Package ID length:', SUI_CONTRACTS.packageId.length);
  console.log('Package ID valid:', SUI_CONTRACTS.packageId.startsWith('0x') && SUI_CONTRACTS.packageId.length === 66);
}

export const SUI_CLOCK_OBJECT_ID = '0x6';

// Gas budget configuration (in MIST)
export const GAS_BUDGET = {
  DEFAULT: 50_000_000, // 0.05 SUI
  MESSAGE: 30_000_000,  // 0.03 SUI
  NFT_MINT: 100_000_000, // 0.1 SUI
  NFT_TRANSFER: 50_000_000, // 0.05 SUI
  GAME_PLAY: 75_000_000, // 0.075 SUI
  GROUP_CREATE: 50_000_000, // 0.05 SUI
} as const;

export const getSuiRpcUrl = () => {
  switch (SUI_CONTRACTS.network) {
    case 'mainnet':
      return 'https://fullnode.mainnet.sui.io';
    case 'testnet':
      return 'https://fullnode.testnet.sui.io';
    case 'devnet':
      return 'https://fullnode.devnet.sui.io';
    default:
      return 'https://fullnode.testnet.sui.io';
  }
};