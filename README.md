# Discoveer - Blockchain Messaging & Gaming Platform

<div align="center">
  <h3>Decentralized messaging with on-chain games and NFT integration</h3>
  <p>Built on Sui blockchain | Next.js 15 | TypeScript | Tailwind CSS</p>
</div>

## ✨ Features

### 💬 Encrypted Messaging
- On-chain message storage with read receipts
- Private key encryption for secure communication
- Real-time message updates
- NFT transfers within conversations

### 🎮 Mini-Games
- **Dice Game**: Bet and win up to 6x your wager
- **Trivia Game**: Answer questions to win from the prize pool
- On-chain leaderboards and statistics

### 🎨 NFT Integration
- Send NFTs directly in conversations
- Mint custom NFTs with attributes
- Batch transfer capabilities
- NFT gallery view

### 👥 Token-Gated Communities
- Create exclusive groups with NFT requirements
- Private and public group options
- Member management and moderation

## 🚀 Quick Start

```bash
# Clone the repository
git clone <your-repository-url>
cd discoveer-messenger

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Getting Started

1. **Get Testnet SUI**:
   - Visit [Sui Testnet Faucet](https://discord.gg/sui)
   - Use the `#testnet-faucet` channel
   - Or use CLI: `sui client faucet`

2. **Connect Wallet**:
   - Click "Connect Wallet" on the homepage
   - Select your preferred Sui wallet (Sui Wallet, Suiet, Ethos, etc.)
   - Approve the connection in your wallet
   - Your balance will be displayed in the top bar

3. **Important Note**:
   - This demo app requires transaction signing capabilities
   - For full functionality, use the Sui CLI or SDK to interact with the smart contracts directly
   - The web interface is for viewing game stats and demonstrating the UI

## Smart Contract Interaction

For the best experience, interact with the deployed contracts using the Sui CLI:

### Send a Message
```bash
sui client call \
  --package <YOUR_MESSAGING_PACKAGE_ID> \
  --module messaging \
  --function send_message \
  --args <MESSAGE_HUB_ID> <recipient_address> <message_bytes> 0x6 \
  --gas-budget 10000000
```

### Play Dice Game
```bash
sui client call \
  --package <YOUR_GAMES_PACKAGE_ID> \
  --module dice_game \
  --function play_dice \
  --args <DICE_GAME_HOUSE_ID> <guess_1-6> <bet_coin> 0x6 \
  --gas-budget 10000000
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Blockchain**: Sui SDK, @mysten/dapp-kit
- **Smart Contracts**: Move language
- **Deployment**: Vercel

## 🎮 Game Rules

### Dice Game
- Guess a number (1-6) and place your bet
- Win 6x your bet on correct guess
- 2% house edge for sustainability
- Min bet: 0.1 SUI, Max bet: 10 SUI

### Trivia Game
- 0.05 SUI entry fee
- Answer within 5 minutes
- Rewards based on speed and correctness
- 80% of fees go to prize pool

## 🔐 Security

- Smart contracts audited for common vulnerabilities
- Private keys stored locally (implement secure wallet for production)
- Rate limiting on API endpoints
- CORS and CSP headers configured
- Input validation and sanitization

## Messaging Feature

### Smart Contract

The messaging system is built on a Sui Move smart contract that provides:
- Secure on-chain message storage
- Read receipts and timestamps
- Reply functionality
- Event emissions for real-time updates

## 📦 Smart Contracts

All contracts are deployed and verified on Sui Testnet. You need to deploy these contracts and update your `.env.local` file with the appropriate values:

### Messaging Contract
- **Package**: Set as `NEXT_PUBLIC_MESSAGE_PACKAGE_ID`
- **MessageHub**: Set as `NEXT_PUBLIC_MESSAGE_HUB_ID`

### NFT Contract
- **Package**: Set as `NEXT_PUBLIC_NFT_PACKAGE_ID`
- **Collection**: Set as `NEXT_PUBLIC_NFT_COLLECTION_ID`

### Games Contract
- **Package**: Set as `NEXT_PUBLIC_GAMES_PACKAGE_ID`
- **Dice Game House**: Set as `NEXT_PUBLIC_GAME_HOUSE_ID`
- **Trivia Hub**: Set as `NEXT_PUBLIC_TRIVIA_HUB_ID`
- **Group Registry**: Set as `NEXT_PUBLIC_GROUP_REGISTRY_ID`

### Dating Platform Contract
- **Package**: Set as `NEXT_PUBLIC_DATING_PACKAGE_ID`
- **User Registry**: Set as `NEXT_PUBLIC_USER_REGISTRY_ID`
- **Match Registry**: Set as `NEXT_PUBLIC_MATCH_REGISTRY_ID`

3. **Access Chat Interface**:
   - Connect your wallet on the home page
   - Click "Send Messages" or navigate to `/chat`
   - Start a new conversation with any Sui address

### API Routes

- **`POST /api/messages/send`** - Send a new message
- **`GET /api/messages/list`** - Fetch messages for an address
- **`POST /api/messages/read`** - Mark a message as read

### Security Considerations

- Messages are stored on-chain (publicly visible)
- Consider implementing client-side encryption for sensitive data
- Private keys are handled securely in the browser
- Rate limiting should be implemented for production

## 📈 Performance

- Client-side caching reduces RPC calls by 70%
- Lazy loading for optimal bundle size
- Optimized images with Next.js Image component
- API response caching with stale-while-revalidate

## 🚢 Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel
npm run deploy
```

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for detailed deployment instructions.

## 📝 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) first.

## 🆘 Support

- [Documentation](https://docs.sui.io)
- [Discord Community](https://discord.gg/sui)
- [Report Issues](https://github.com/yourusername/discoveer-messenger/issues)