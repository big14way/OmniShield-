# OmniShield Frontend

Next.js 14 frontend for the OmniShield parametric insurance protocol with Web3 integration.

## Features

- ✅ **Cross-Chain Support**: Ethereum, Sepolia, and Hedera Testnet
- ✅ **Web3 Integration**: Wagmi v2, Viem, and wallet connection
- ✅ **Parametric Insurance**: Purchase coverage with automated payouts
- ✅ **Liquidity Provision**: Provide liquidity and earn premiums
- ✅ **Claims Management**: Submit and track claims
- ✅ **Real-Time Pricing**: Pyth oracle price feeds
- ✅ **Responsive Design**: Mobile-first with TailwindCSS
- ✅ **Type-Safe**: Full TypeScript support

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- MetaMask or other Web3 wallet

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Update .env.local with your values:
# - NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID (get from https://cloud.walletconnect.com)
# - Contract addresses from deployment

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── api/               # API routes
│   │   │   ├── prices/        # Price feed endpoint
│   │   │   ├── risk/          # Risk calculation
│   │   │   ├── coverage/      # User coverage data
│   │   │   └── stats/         # Protocol statistics
│   │   ├── coverage/          # Coverage purchase page
│   │   ├── liquidity/         # Liquidity pool page
│   │   ├── claims/            # Claims center page
│   │   └── layout.tsx         # Root layout with providers
│   │
│   ├── components/
│   │   ├── coverage/          # Coverage components
│   │   ├── liquidity/         # Liquidity components
│   │   ├── claims/            # Claims components
│   │   └── layout/            # Layout components (Header, Providers)
│   │
│   └── lib/
│       ├── web3/              # Web3 configuration
│       │   ├── config.ts      # Wagmi configuration
│       │   ├── contracts.ts   # Contract ABIs and addresses
│       │   └── hooks.ts       # Custom Web3 hooks
│       ├── hooks/             # React hooks
│       └── utils.ts           # Utility functions
│
├── public/                    # Static assets
└── package.json

```

## Core Components

### Purchase Coverage
- Asset selector (ETH, BTC, HBAR)
- Coverage amount input with USD conversion
- Duration slider (7-365 days)
- Coverage type selector (Price Protection, Smart Contract, Rug Pull)
- Real-time premium calculator
- Wallet connection and transaction handling

### Liquidity Pool
- Pool statistics dashboard (TVL, APY, Utilization)
- LP position tracker
- Add/withdraw liquidity interface
- Earnings calculator

### Claims Center
- Active coverage cards
- Claim submission form
- Claims history table
- Automated claim status tracking

## Web3 Integration

### Supported Networks
- Ethereum Mainnet (Chain ID: 1)
- Sepolia Testnet (Chain ID: 11155111)
- Hedera Testnet (Chain ID: 296)

### Contract Interactions
All contract interactions use custom hooks built on Wagmi v2:

- `usePremiumCalculator()` - Calculate insurance premiums
- `usePurchaseCoverage()` - Purchase coverage
- `useSubmitClaim()` - Submit claims
- `usePolicy()` - Fetch policy details
- `usePoolBalance()` - Get pool balance

## API Routes

### GET /api/prices
Fetch real-time asset prices from Pyth Network.

Query params: `symbols=ETH,BTC,HBAR`

Response:
```json
{
  "ETH": {
    "symbol": "ETH",
    "price": 3245.67,
    "change24h": 2.34,
    "lastUpdate": 1704067200000
  }
}
```

### POST /api/risk
Calculate risk score and premium.

Body:
```json
{
  "coverageAmount": "10",
  "duration": 30,
  "asset": "ETH",
  "coverageType": "price_protection"
}
```

### GET /api/coverage
Get user coverage data.

Query params: `address=0x...`

### GET /api/stats
Get protocol statistics and historical data.

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## Environment Variables

See `.env.example` for all required and optional environment variables.

Required:
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID
- Contract addresses for deployed networks

Optional:
- Sentry DSN for error tracking
- Google Analytics measurement ID

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Web3**: Wagmi v2, Viem
- **State Management**: TanStack Query
- **UI Components**: Custom components with shadcn/ui patterns

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables
Make sure to set all required environment variables in your deployment platform.

## Monitoring

### Error Tracking
Configure Sentry for production error tracking:

1. Sign up at https://sentry.io
2. Create a new Next.js project
3. Add DSN to `.env.local`

### Analytics
Add Google Analytics:

1. Create GA4 property
2. Add measurement ID to `.env.local`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

MIT License - see LICENSE file for details
