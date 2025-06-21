# Games Contract Deployment Information

## Testnet Deployment (Deployed: 2025-06-19)

### Package Information
- **Package ID**: `0xee0b758075ff9449750dd2998618589136104837b1ededd3ed585bc6fb9f9dfc`
- **Transaction**: [View on Sui Explorer](https://testnet.suivision.xyz/txblock/9ynLXuSipWkuNf2LXxXAmQazEgMjt5L6yEhR5xJQj7RF)

### Shared Objects

#### Dice Game
- **GameHouse ID**: `0xcbe4b8a1047108928ab0a8ac835079a73c04896cdde0d2b41e9e2308ad76282b`
- **Type**: `0xee0b758075ff9449750dd2998618589136104837b1ededd3ed585bc6fb9f9dfc::dice_game::GameHouse`

#### Trivia Game
- **TriviaHub ID**: `0x844f46922dc01edddfca80fae4ee31a86e329b11f0799a237652fb290bf77dd1`
- **Type**: `0xee0b758075ff9449750dd2998618589136104837b1ededd3ed585bc6fb9f9dfc::trivia_game::TriviaHub`

#### Group Chat
- **GroupRegistry ID**: `0xf7212888b14d87f4d343ab87a211e2acab4ab07d6fc2969add05c8431329e2f3`
- **Type**: `0xee0b758075ff9449750dd2998618589136104837b1ededd3ed585bc6fb9f9dfc::group_chat::GroupRegistry`

## Usage

### Dice Game
- Players bet SUI and guess a dice roll (1-6)
- 6x payout with 2% house edge
- Minimum bet: 0.1 SUI
- Maximum bet: 10 SUI

### Trivia Game
- Entry fee: 0.05 SUI
- Questions are active for 5 minutes
- Reward pool is 80% of balance
- Time-based bonus for quick answers

### Group Chat
- Create NFT-gated groups
- Send on-chain messages
- Maximum 100 members per group
- Admins can set NFT requirements