# Discoveer - Production-Ready Web3 Messaging & Gaming Platform

A decentralized messaging platform built on Sui blockchain featuring encrypted messaging, NFT transfers, mini-games, and token-gated communities.

## 🚀 Features

### Core Features
- **Encrypted Messaging**: On-chain messages with read receipts
- **NFT Integration**: Send NFTs directly within conversations
- **Mini-Games**: Dice roll and trivia games with SUI rewards
- **Token-Gated Groups**: NFT-based access control for exclusive communities
- **Wallet Support**: External wallets and in-app wallet creation

### Smart Contracts
All contracts are deployed to Sui Testnet and fully functional:

#### Messaging Contract
- Package: `0xd4cb9a02cab2481e241997af5e98f50305232893b66afb064a1e37f42f8e0528`
- MessageHub: `0xdc3351f49f222c37c9a20f27d2a22b8726a18472bbb37018a11ebbcdd07d9954`

#### NFT Contract
- Package: `0x44a258ad8ea5532023e02f910869fc0b9aec2b464cc6671f414445e4ffbcf551`
- Collection: `0x032d7b691908afb6fe15d32f835008821aa6efd262d5b691aa7414a137627104`

#### Games Contract
- Package: `0xee0b758075ff9449750dd2998618589136104837b1ededd3ed585bc6fb9f9dfc`
- Dice Game House: `0xcbe4b8a1047108928ab0a8ac835079a73c04896cdde0d2b41e9e2308ad76282b`
- Trivia Hub: `0x844f46922dc01edddfca80fae4ee31a86e329b11f0799a237652fb290bf77dd1`
- Group Registry: `0xf7212888b14d87f4d343ab87a211e2acab4ab07d6fc2969add05c8431329e2f3`

## 🛠️ Technical Architecture

### Frontend
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Clean, modern design without AI-generated aesthetics
- **State Management**: React Context API
- **Blockchain Integration**: @mysten/dapp-kit

### Backend
- **API Routes**: Next.js API routes for blockchain interactions
- **Smart Contracts**: Move language on Sui
- **Real-time Updates**: Polling with optimistic updates

### Performance Optimizations
- Client-side caching for blockchain data
- Optimistic UI updates
- Efficient contract calls with batch operations
- Lazy loading for components

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/discoveer-messenger.git
cd discoveer-messenger
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Run the development server:
```bash
npm run dev
```

## 🎮 Game Instructions

### Dice Game
- **Min Bet**: 0.1 SUI
- **Max Bet**: 10 SUI
- **Payout**: 6x on correct guess
- **House Edge**: 2%

### Trivia Game
- **Entry Fee**: 0.05 SUI
- **Question Duration**: 5 minutes
- **Reward**: Based on speed and correctness
- **Prize Pool**: 80% of collected fees

## 🔒 Security Considerations

### Smart Contract Security
- All contracts use secure random number generation
- Proper access control for admin functions
- Reentrancy protection
- Input validation

### Frontend Security
- Private keys stored in localStorage (consider secure alternatives for production)
- All contract calls validated
- Rate limiting should be implemented
- CORS properly configured

## 🚀 Deployment

### Smart Contract Deployment
Contracts are already deployed to testnet. For mainnet:

1. Update Move.toml with mainnet dependencies
2. Test thoroughly on testnet
3. Deploy with sufficient gas budget
4. Update environment variables

### Frontend Deployment

#### Vercel (Recommended)
```bash
vercel --prod
```

#### Environment Variables for Production:
- `NEXT_PUBLIC_SUI_NETWORK`: Set to "mainnet"
- Update all contract addresses to mainnet deployments

## 📊 Monitoring & Analytics

### Recommended Tools
- **Sui Explorer**: Monitor on-chain activity
- **Vercel Analytics**: Frontend performance
- **Sentry**: Error tracking
- **LogRocket**: User session replay

### Key Metrics to Track
- Daily active users
- Message volume
- Game participation rate
- NFT transfer volume
- Gas costs

## 🔧 Maintenance

### Regular Tasks
1. Monitor contract balances
2. Update game questions (trivia)
3. Review and moderate groups
4. Check for Sui SDK updates
5. Security audits

### Scaling Considerations
- Implement message pagination
- Add caching layer (Redis)
- Use CDN for static assets
- Consider indexer for complex queries

## 📝 API Documentation

### Game APIs

#### Play Dice
```typescript
POST /api/games/dice/play
{
  guess: number (1-6),
  betAmount: number (in MIST),
  senderPrivateKey: string
}
```

#### Answer Trivia
```typescript
POST /api/games/trivia/answer
{
  answer: number (0-3),
  senderPrivateKey: string
}
```

### Message APIs

#### Send Message
```typescript
POST /api/messages/send
{
  recipient: string,
  content: string,
  senderPrivateKey: string
}
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- Documentation: [docs.sui.io](https://docs.sui.io)
- Discord: [Join our community](https://discord.gg/sui)
- Issues: [GitHub Issues](https://github.com/yourusername/discoveer-messenger/issues)

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Core messaging functionality
- ✅ NFT transfers
- ✅ Basic games (dice, trivia)
- ✅ Group chat foundation

### Phase 2
- [ ] Voice/Video calls via WebRTC
- [ ] Advanced game mechanics
- [ ] DAO governance for groups
- [ ] Mobile app

### Phase 3
- [ ] Cross-chain messaging
- [ ] AI-powered features
- [ ] Marketplace integration
- [ ] Advanced analytics dashboard