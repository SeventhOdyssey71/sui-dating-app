# NFT Contract Testing Guide

## Deployed Contract Info

- **Package ID**: `0x44a258ad8ea5532023e02f910869fc0b9aec2b464cc6671f414445e4ffbcf551`
- **Collection ID**: `0x032d7b691908afb6fe15d32f835008821aa6efd262d5b691aa7414a137627104`
- **Network**: Sui Testnet
- **[View on Explorer](https://testnet.suivision.xyz/txblock/J1immtqp9m9bparZ6Jre6Ro5G7cRTVSnCdNQnuZpm1mz)**

## Testing NFT Transfers in the App

### 1. Mint Test NFTs

1. Connect your wallet on the homepage
2. Click "Mint NFT" button in the navigation
3. Fill in the NFT details:
   - **Name**: Give your NFT a unique name
   - **Description**: Add a description
   - **Image URL**: Use a valid image URL (e.g., `https://picsum.photos/400/400`)
   - **Attributes** (optional): Add traits like "Rarity: Rare", "Color: Blue"
4. Click "Mint NFT" to create it

### 2. Send NFTs in Chat

1. Navigate to the Chat page (`/chat`)
2. Start a new conversation or select an existing one
3. Click the package icon (📦) next to the message input
4. Select one or more NFTs from your collection
5. Add an optional message
6. Click Send to transfer the NFTs and send the message

### 3. Verify NFT Transfer

1. The recipient will receive the NFTs in their wallet
2. Check the transaction on [Sui Explorer](https://testnet.suivision.xyz/)
3. The message will show which NFTs were attached

## CLI Testing Commands

### Mint NFT via CLI
```bash
PACKAGE=0x44a258ad8ea5532023e02f910869fc0b9aec2b464cc6671f414445e4ffbcf551
COLLECTION=0x032d7b691908afb6fe15d32f835008821aa6efd262d5b691aa7414a137627104

# Mint a simple NFT
sui client call \
  --package $PACKAGE \
  --module nft \
  --function mint_nft \
  --args $COLLECTION "Test NFT" "A test NFT for messaging" "https://example.com/nft.png" "0xRECIPIENT_ADDRESS" \
  --gas-budget 10000000

# Mint with attributes
sui client call \
  --package $PACKAGE \
  --module nft \
  --function mint_nft_with_attributes \
  --args $COLLECTION "Rare NFT" "NFT with attributes" "https://example.com/rare.png" \
  '["Rarity", "Power"]' '["Legendary", "100"]' "0xRECIPIENT_ADDRESS" \
  --gas-budget 10000000
```

### Transfer NFT via CLI
```bash
# Single transfer
sui client call \
  --package $PACKAGE \
  --module nft \
  --function transfer_nft \
  --args "0xNFT_OBJECT_ID" "0xRECIPIENT_ADDRESS" \
  --gas-budget 10000000
```

### View Your NFTs
```bash
# List all NFTs owned by your address
sui client objects --filter StructType=$PACKAGE::nft::DiscoveerNFT

# Get details of a specific NFT
sui client object "0xNFT_OBJECT_ID" --json
```

## Test Scenarios

### Scenario 1: Basic NFT Transfer
1. User A mints an NFT
2. User A sends the NFT to User B via chat
3. Verify User B receives the NFT
4. Check the message shows the NFT attachment

### Scenario 2: Batch Transfer
1. User A mints multiple NFTs
2. User A selects multiple NFTs in the chat
3. Send all NFTs in one transaction
4. Verify all NFTs are transferred

### Scenario 3: NFT with Message
1. Mint an NFT with custom attributes
2. Attach NFT to a message
3. Send both together
4. Verify the message content includes NFT info

## Common Issues

### "Not Owner" Error
- Only the collection creator (the address that deployed the contract) can mint NFTs
- To mint as a different user, create a new collection first

### NFT Not Showing
- Ensure the image URL is accessible (CORS enabled)
- Check that the NFT was minted to your address
- Refresh the NFT list in the selector

### Transfer Failed
- Verify you own the NFT you're trying to transfer
- Check that the recipient address is valid
- Ensure you have enough SUI for gas

## Security Notes

- NFTs are permanently transferred - there's no undo
- Only the NFT owner can transfer their NFTs
- Collection creators control minting permissions
- All transfers are recorded on-chain