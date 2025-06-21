# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Discoveer is a blockchain-based messaging and gaming platform built on the Sui blockchain. It combines encrypted messaging, NFT transfers, mini-games (dice and trivia), and token-gated communities into a comprehensive Web3 social platform.

## Development Commands

### Local Development
```bash
# Install dependencies (requires Node.js ^20.0.0)
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

### Smart Contract Interaction (Sui CLI)
```bash
# Send a message
sui client call \
  --package 0xd4cb9a02cab2481e241997af5e98f50305232893b66afb064a1e37f42f8e0528 \
  --module messaging \
  --function send_message \
  --args 0xdc3351f49f222c37c9a20f27d2a22b8726a18472bbb37018a11ebbcdd07d9954 <recipient_address> <message_bytes> 0x6 \
  --gas-budget 10000000

# Play dice game
sui client call \
  --package 0xee0b758075ff9449750dd2998618589136104837b1ededd3ed585bc6fb9f9dfc \
  --module dice_game \
  --function play_dice \
  --args 0xcbe4b8a1047108928ab0a8ac835079a73c04896cdde0d2b41e9e2308ad76282b <guess_1-6> <bet_coin> 0x6 \
  --gas-budget 10000000
```

### Deployment
```bash
# Deploy to Vercel
vercel --prod

# Check deployment status
vercel ls
```

## Architecture Overview

### Frontend Stack
- **Next.js 14.2.5** with App Router - Server-side rendering and API routes
- **React 18.3.1** with TypeScript 5.0 - Type-safe component development
- **@mysten/dapp-kit** - Sui wallet integration (Sui Wallet, Suiet, Ethos)
- **@tanstack/react-query** - Efficient data fetching and caching
- **Tailwind CSS 3.4.6** - Utility-first styling

### Directory Structure
```
/app/               # Next.js App Router pages and API routes
  /api/            # API endpoints for blockchain interactions
    /games/        # Dice and trivia game endpoints
    /messages/     # Messaging endpoints
    /nft/         # NFT minting and transfer endpoints
    /groups/      # Token-gated group endpoints
  /chat/          # Chat interface pages
  /games/         # Gaming interface pages
  /groups/        # Group management pages
  /admin/         # Admin dashboard

/components/       # React components
  Chat components (ChatInterface, MessageList, ConversationsList)
  Game components (DiceGame, TriviaGame)
  NFT components (NFTMinter, NFTGallery, NFTSelector)
  Group components (GroupList, GroupDetails)

/contracts/        # Move smart contracts
  /messaging/     # On-chain messaging system
  /nft/          # NFT collection contract
  /games/        # Dice game, trivia, and groups

/hooks/           # Custom React hooks for blockchain logic
/lib/            # Utilities (Sui client, caching, gas estimation)
/contexts/       # React contexts (authentication)
```

### Smart Contract Architecture

All contracts are written in Move language and deployed on Sui:

1. **Messaging System** (`/contracts/messaging/`)
   - On-chain message storage with timestamps
   - Read receipts tracking
   - Reply functionality
   - Event emissions for real-time updates

2. **NFT System** (`/contracts/nft/`)
   - Collection-based NFT minting
   - Batch transfer capabilities
   - Custom attributes support

3. **Gaming System** (`/contracts/games/`)
   - **Dice Game**: 6x payout betting with 2% house edge
   - **Trivia Game**: Time-based Q&A with prize pools
   - **Groups**: NFT-gated access control

### API Route Pattern

All API routes follow a consistent pattern:
1. Parse and validate request body
2. Create Sui transaction block
3. Execute transaction with user's private key
4. Return transaction result

Example structure:
```typescript
// /app/api/[feature]/[action]/route.ts
export async function POST(request: Request) {
  const { ...params, senderPrivateKey } = await request.json();
  // Validation
  // Transaction building
  // Execution
  // Response
}
```

### Performance Optimizations

1. **Caching Layer** (`/lib/cache.ts`)
   - Client-side caching reduces RPC calls by 70%
   - Implements stale-while-revalidate pattern

2. **Lazy Loading**
   - Heavy components use dynamic imports
   - Route-based code splitting

3. **Gas Optimization**
   - Gas estimation utilities in `/lib/gasEstimation.ts`
   - Batch operations where possible

### Key Integration Points

1. **Wallet Connection** (`/components/WalletConnect.tsx`)
   - Uses @mysten/dapp-kit for multi-wallet support
   - Stores connection state in AuthContext

2. **Transaction Building** (`/lib/suiClient.ts`)
   - Centralized Sui client configuration
   - Handles both testnet and mainnet

3. **Real-time Updates**
   - Polling-based updates for messages and game states
   - Optimistic UI updates for better UX

## Contract Addresses (Testnet)

```typescript
// Messaging
MESSAGING_PACKAGE_ID = "0xd4cb9a02cab2481e241997af5e98f50305232893b66afb064a1e37f42f8e0528"
MESSAGE_HUB_ID = "0xdc3351f49f222c37c9a20f27d2a22b8726a18472bbb37018a11ebbcdd07d9954"

// NFT
NFT_PACKAGE_ID = "0x44a258ad8ea5532023e02f910869fc0b9aec2b464cc6671f414445e4ffbcf551"
NFT_COLLECTION_ID = "0x032d7b691908afb6fe15d32f835008821aa6efd262d5b691aa7414a137627104"

// Games
GAMES_PACKAGE_ID = "0xee0b758075ff9449750dd2998618589136104837b1ededd3ed585bc6fb9f9dfc"
DICE_GAME_HOUSE_ID = "0xcbe4b8a1047108928ab0a8ac835079a73c04896cdde0d2b41e9e2308ad76282b"
TRIVIA_HUB_ID = "0x844f46922dc01edddfca80fae4ee31a86e329b11f0799a237652fb290bf77dd1"
GROUP_REGISTRY_ID = "0xf7212888b14d87f4d343ab87a211e2acab4ab07d6fc2969add05c8431329e2f3"
```

## Common Development Tasks

### Adding a New API Endpoint
1. Create route file in `/app/api/[feature]/[action]/route.ts`
2. Import `suiClient` from `/lib/suiClient`
3. Follow existing patterns for transaction building
4. Add error handling and validation

### Creating a New Component
1. Check existing components for patterns
2. Use TypeScript interfaces for props
3. Implement loading and error states
4. Use Tailwind classes for styling

### Modifying Smart Contracts
1. Edit Move files in `/contracts/[module]/sources/`
2. Update tests in `/contracts/[module]/tests/`
3. Build with `sui move build`
4. Test with `sui move test`
5. Deploy and update contract addresses in `.env.local`

## Testing Approach

- Frontend: No testing framework configured (consider adding Jest/Vitest)
- Smart Contracts: Move tests in `/contracts/*/tests/`
- Manual testing: Use Sui CLI for contract interaction

## Security Considerations

1. Private keys are stored in localStorage (implement secure wallet for production)
2. All user inputs are validated before blockchain interaction
3. Contract calls use proper access control
4. Rate limiting should be implemented for production
5. CORS and CSP headers are configured

## Deployment Notes

- Configured for Vercel deployment
- Environment variables required in `.env.local`
- For mainnet: Update `NEXT_PUBLIC_SUI_NETWORK` and all contract addresses
- See `DEPLOYMENT_CHECKLIST.md` for detailed deployment steps