# Sui Messaging Contract Deployment Guide

## Prerequisites

1. Install Sui CLI:
```bash
# macOS
brew install sui

# Or download from releases
curl -fsSL https://github.com/MystenLabs/sui/releases/download/testnet-v1.26.1/sui-testnet-v1.26.1-macos-arm64.tgz | tar -xz
sudo mv sui /usr/local/bin/
```

2. Set up Sui wallet:
```bash
# Create new address
sui client new-address ed25519

# Or import existing
sui keytool import <private-key> ed25519

# Switch to testnet
sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443
sui client switch --env testnet
```

3. Get testnet SUI tokens:
```bash
# Request from faucet
sui client faucet

# Or use web faucet
# Visit: https://discord.gg/sui and use #testnet-faucet channel
```

## Building the Contract

```bash
cd contracts/messaging

# Build the package
sui move build

# Run tests
sui move test
```

## Deploying to Testnet

1. Deploy the contract:
```bash
sui client publish --gas-budget 200000000

# Save the output, you'll need:
# - Package ID: 0x<package_id>
# - MessageHub object ID: 0x<message_hub_id>
# - Transaction digest for verification
```

2. Export deployment info:
```bash
# Create deployment config
echo '{
  "packageId": "0x<your_package_id>",
  "messageHubId": "0x<your_message_hub_id>",
  "network": "testnet"
}' > deployment.json
```

## Testing on Testnet

1. Send a test message:
```bash
# Replace with your values
PACKAGE_ID=0x<your_package_id>
MESSAGE_HUB=0x<message_hub_id>
RECIPIENT=0x<recipient_address>

sui client call \
  --package $PACKAGE_ID \
  --module messaging \
  --function send_message \
  --args $MESSAGE_HUB $RECIPIENT "[72,101,108,108,111]" "0x6" \
  --gas-budget 10000000
```

2. Query message hub:
```bash
sui client object $MESSAGE_HUB
```

3. View transaction:
```bash
sui client transaction <tx_digest>
```

## Interacting via TypeScript

```typescript
import { SuiClient } from '@mysten/sui/client';
import { TransactionBlock } from '@mysten/sui/transactions';

const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io' });

// Send message function
async function sendMessage(
  signer: any,
  messageHub: string,
  recipient: string,
  content: string
) {
  const tx = new TransactionBlock();
  
  // Convert string to bytes
  const contentBytes = Array.from(new TextEncoder().encode(content));
  
  tx.moveCall({
    target: `${PACKAGE_ID}::messaging::send_message`,
    arguments: [
      tx.object(messageHub),
      tx.pure.address(recipient),
      tx.pure(contentBytes),
      tx.object('0x6'), // Clock object
    ],
  });

  const result = await signer.signAndExecuteTransactionBlock({
    transactionBlock: tx,
  });
  
  return result;
}
```

## Monitoring Events

```typescript
// Subscribe to message events
const unsubscribe = await client.subscribeEvent({
  filter: {
    MoveModule: {
      package: PACKAGE_ID,
      module: 'messaging',
    },
  },
  onMessage: (event) => {
    console.log('New message event:', event);
  },
});
```

## Useful Commands

```bash
# Check balance
sui client balance

# List objects
sui client objects

# Get object details
sui client object <object_id> --json

# Dry run transaction
sui client dry-run <transaction>
```

## Troubleshooting

1. **Insufficient gas**: Request more SUI from faucet
2. **Build errors**: Ensure Sui CLI version matches Move edition
3. **Object not found**: Verify object IDs and ownership
4. **Transaction failed**: Check error codes in contract

## Security Considerations

- Messages are stored on-chain (consider encryption for sensitive data)
- Only recipients can mark messages as read
- Message Hub is a shared object for global access
- Consider implementing rate limiting in production