// Validate Sui address format
export function isValidSuiAddress(address: string): boolean {
  if (!address) return false;
  
  // Trim any whitespace
  const trimmed = address.trim();
  
  // Check if it starts with 0x
  if (!trimmed.startsWith('0x')) return false;
  
  // Check length (Sui addresses are 66 characters: 0x + 64 hex chars)
  if (trimmed.length !== 66) return false;
  
  // Check if all characters after 0x are valid hex
  const hexPart = trimmed.slice(2);
  return /^[0-9a-fA-F]{64}$/.test(hexPart);
}

// Validate and format Sui address
export function formatSuiAddress(address: string): string {
  const trimmed = address.trim();
  
  // If already valid, return as is
  if (isValidSuiAddress(trimmed)) {
    return trimmed.toLowerCase();
  }
  
  // If missing 0x prefix but otherwise valid
  if (trimmed.length === 64 && /^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return `0x${trimmed.toLowerCase()}`;
  }
  
  throw new Error(`Invalid Sui address: ${address}`);
}

// Validate package ID and object IDs
export function validateContractConfig() {
  const errors: string[] = [];
  
  // Check package IDs
  if (!process.env.NEXT_PUBLIC_PACKAGE_ID) {
    errors.push('NEXT_PUBLIC_PACKAGE_ID is not defined');
  } else if (!isValidSuiAddress(process.env.NEXT_PUBLIC_PACKAGE_ID)) {
    errors.push(`Invalid NEXT_PUBLIC_PACKAGE_ID: ${process.env.NEXT_PUBLIC_PACKAGE_ID}`);
  }
  
  if (!process.env.NEXT_PUBLIC_MESSAGE_HUB_ID) {
    errors.push('NEXT_PUBLIC_MESSAGE_HUB_ID is not defined');
  } else if (!isValidSuiAddress(process.env.NEXT_PUBLIC_MESSAGE_HUB_ID)) {
    errors.push(`Invalid NEXT_PUBLIC_MESSAGE_HUB_ID: ${process.env.NEXT_PUBLIC_MESSAGE_HUB_ID}`);
  }
  
  if (!process.env.NEXT_PUBLIC_NFT_PACKAGE_ID) {
    errors.push('NEXT_PUBLIC_NFT_PACKAGE_ID is not defined');
  } else if (!isValidSuiAddress(process.env.NEXT_PUBLIC_NFT_PACKAGE_ID)) {
    errors.push(`Invalid NEXT_PUBLIC_NFT_PACKAGE_ID: ${process.env.NEXT_PUBLIC_NFT_PACKAGE_ID}`);
  }
  
  if (!process.env.NEXT_PUBLIC_GAMES_PACKAGE_ID) {
    errors.push('NEXT_PUBLIC_GAMES_PACKAGE_ID is not defined');
  } else if (!isValidSuiAddress(process.env.NEXT_PUBLIC_GAMES_PACKAGE_ID)) {
    errors.push(`Invalid NEXT_PUBLIC_GAMES_PACKAGE_ID: ${process.env.NEXT_PUBLIC_GAMES_PACKAGE_ID}`);
  }
  
  return errors;
}