# OmniShield Frontend Setup Guide

## Overview

Complete Next.js 14 frontend implementation with Web3 integration for the OmniShield parametric insurance protocol.

## ✅ Implementation Status

### Core Infrastructure

- ✅ Next.js 14 with App Router
- ✅ TypeScript configuration
- ✅ TailwindCSS v4 setup
- ✅ shadcn/ui component structure
- ✅ Web3 integration (Wagmi v2, Viem)
- ✅ TanStack Query for state management

### Components Implemented

#### 1. Coverage Purchase (`/components/coverage/PurchaseCoverage.tsx`)

- ✅ Asset selector with ETH, BTC, HBAR
- ✅ Coverage amount input with real-time USD conversion
- ✅ Duration slider (7-365 days)
- ✅ Coverage type selector (3 types)
- ✅ Real-time premium calculator
- ✅ Transaction handling with loading states
- ✅ Success notifications

#### 2. Liquidity Pool (`/components/liquidity/LiquidityPool.tsx`)

- ✅ Pool statistics dashboard (TVL, APY, Utilization)
- ✅ LP position tracker
- ✅ Add liquidity modal
- ✅ Withdraw interface
- ✅ Earnings calculator
- ✅ How-it-works guide

#### 3. Claims Center (`/components/claims/ClaimsCenter.tsx`)

- ✅ Active coverage cards display
- ✅ Claim submission form
- ✅ Claims history table
- ✅ Status tracking (pending, approved, rejected, paid)
- ✅ Policy details integration
- ✅ Automated notifications

### Web3 Integration (`/lib/web3/`)

#### Configuration (`config.ts`)

- ✅ Wagmi configuration
- ✅ Multi-chain support (Ethereum, Sepolia, Hedera)
- ✅ WalletConnect integration
- ✅ Injected wallet support

#### Contracts (`contracts.ts`)

- ✅ Contract addresses per network
- ✅ InsurancePool ABI
- ✅ RiskEngine ABI
- ✅ Event definitions

#### Custom Hooks (`hooks.ts`)

- ✅ `useInsurancePool()` - Contract instance
- ✅ `usePremiumCalculator()` - Calculate premiums
- ✅ `usePolicy()` - Fetch policy details
- ✅ `usePoolBalance()` - Get pool TVL
- ✅ `usePurchaseCoverage()` - Purchase coverage
- ✅ `useSubmitClaim()` - Submit claims
- ✅ `useRiskScore()` - Calculate risk

### API Routes (`/app/api/`)

#### `/api/prices` (GET)

```typescript
// Fetch real-time asset prices from Pyth
GET /api/prices?symbols=ETH,BTC,HBAR

Response: {
  "ETH": { symbol, price, change24h, lastUpdate }
}
```

#### `/api/risk` (POST)

```typescript
// Calculate risk score and premium
POST / api / risk;
Body: {
  (coverageAmount, duration, asset, coverageType);
}

Response: {
  (riskScore, premium, premiumPercentage, factors);
}
```

#### `/api/coverage` (GET)

```typescript
// Get user coverage data
GET /api/coverage?address=0x...

Response: { active[], expired[], totalCoverage, activePolicies }
```

#### `/api/stats` (GET)

```typescript
// Protocol statistics
GET / api / stats;

Response: {
  (tvl, totalCoverage, activePolicies, claims, historicalData);
}
```

### Pages

- ✅ `/` - Landing page with hero, features, stats, CTA
- ✅ `/coverage` - Purchase coverage page
- ✅ `/liquidity` - Liquidity pool page
- ✅ `/claims` - Claims center page
- ✅ `/stats` - Protocol statistics (TODO)

### Layout Components

#### Header (`/components/layout/Header.tsx`)

- ✅ Logo and navigation
- ✅ Network switcher (Ethereum, Sepolia, Hedera)
- ✅ Wallet connection UI
- ✅ Address display
- ✅ Disconnect functionality

#### Providers (`/components/layout/Providers.tsx`)

- ✅ Wagmi provider setup
- ✅ QueryClient configuration
- ✅ Global state management

### Utilities

#### `lib/utils.ts`

- ✅ `cn()` - Class name merger
- ✅ `formatAddress()` - Shorten addresses
- ✅ `formatCurrency()` - Format USD values
- ✅ `formatPercent()` - Format percentages
- ✅ `formatDuration()` - Format time periods

#### `lib/hooks/usePrices.ts`

- ✅ `usePrices()` - Fetch multiple prices
- ✅ `useAssetPrice()` - Fetch single asset price
- ✅ 30-second auto-refresh
- ✅ Error handling

## Installation & Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

**Note**: If Web3 dependencies fail to install:

```bash
npm install wagmi@^2 viem@^2 @tanstack/react-query@^5 --legacy-peer-deps
```

### 2. Environment Configuration

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

**Required Variables**:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Get from https://cloud.walletconnect.com
```

**Contract Addresses** (update after deployment):

```env
NEXT_PUBLIC_SEPOLIA_INSURANCE_POOL=0x...
NEXT_PUBLIC_SEPOLIA_RISK_ENGINE=0x...
NEXT_PUBLIC_HEDERA_INSURANCE_POOL=0x...
```

### 3. Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open http://localhost:3000

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── api/                 # API routes
│   │   │   ├── prices/         # Price feeds
│   │   │   ├── risk/           # Risk calculation
│   │   │   ├── coverage/       # User data
│   │   │   └── stats/          # Protocol stats
│   │   ├── coverage/           # Coverage page
│   │   ├── liquidity/          # Liquidity page
│   │   ├── claims/             # Claims page
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Landing page
│   │   └── globals.css         # Global styles
│   │
│   ├── components/
│   │   ├── coverage/           # Coverage components
│   │   │   └── PurchaseCoverage.tsx
│   │   ├── liquidity/          # Liquidity components
│   │   │   └── LiquidityPool.tsx
│   │   ├── claims/             # Claims components
│   │   │   └── ClaimsCenter.tsx
│   │   └── layout/             # Layout components
│   │       ├── Header.tsx
│   │       └── Providers.tsx
│   │
│   └── lib/
│       ├── web3/               # Web3 configuration
│       │   ├── config.ts       # Wagmi setup
│       │   ├── contracts.ts    # ABIs & addresses
│       │   └── hooks.ts        # Custom hooks
│       ├── hooks/              # React hooks
│       │   └── usePrices.ts
│       └── utils.ts            # Utility functions
│
├── public/                     # Static assets
├── .env.example                # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## Key Features

### 1. Multi-Chain Support

- Ethereum Mainnet (Chain ID: 1)
- Sepolia Testnet (Chain ID: 11155111)
- Hedera Testnet (Chain ID: 296)

### 2. Real-Time Price Feeds

- Integration with Pyth Network (API route)
- 30-second auto-refresh
- Multiple asset support (ETH, BTC, HBAR)

### 3. Parametric Coverage

- Automated premium calculation
- Real-time risk scoring
- Instant policy creation
- No manual underwriting

### 4. Cross-Chain Operations

- Network switching in UI
- Per-network contract addresses
- Unified user experience

### 5. Responsive Design

- Mobile-first approach
- TailwindCSS utilities
- Modern UI patterns

## Next Steps

### Immediate (Before Production)

1. **Update Contract Addresses**
   - Deploy contracts to Sepolia & Hedera
   - Update `.env.local` with addresses
   - Test all contract interactions

2. **WalletConnect Setup**
   - Create project at cloud.walletconnect.com
   - Add project ID to `.env.local`

3. **Testing**
   - Test all user flows
   - Verify premium calculations
   - Test claim submissions
   - Check network switching

### Enhancements

1. **Monitoring Setup**
   - Add Sentry for error tracking
   - Implement analytics (Google Analytics/Mixpanel)
   - Add performance monitoring

2. **Subgraph Integration**
   - Replace mock data with real subgraph queries
   - User coverage history
   - Protocol statistics
   - Historical charts

3. **Additional Features**
   - Coverage NFT display
   - LP token management
   - Advanced filtering/search
   - Email notifications
   - Mobile app (React Native)

4. **UI Polish**
   - Add loading skeletons
   - Implement toast notifications
   - Add transaction confirmation modals
   - Create help tooltips
   - Add dark mode

## Deployment

### Vercel (Recommended)

```bash
# Install CLI
npm i -g vercel

# Deploy
vercel

# Production
vercel --prod
```

**Environment Variables**: Set in Vercel dashboard

### Alternative: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Troubleshooting

### Issue: Wagmi/Viem installation fails

**Solution**:

```bash
npm install wagmi viem @tanstack/react-query --legacy-peer-deps
```

### Issue: "Module not found: wagmi"

**Solution**: Ensure dependencies are installed:

```bash
npm install
```

### Issue: Contract interactions fail

**Solution**:

1. Check contract addresses in `.env.local`
2. Verify network connection
3. Check wallet network matches app network

### Issue: Prices not loading

**Solution**:

1. Check `/api/prices` route is accessible
2. Verify Pyth integration (if using real data)
3. Check browser console for errors

## Documentation

- [Next.js 14 Docs](https://nextjs.org/docs)
- [Wagmi v2 Docs](https://wagmi.sh)
- [TailwindCSS Docs](https://tailwindcss.com)
- [Viem Docs](https://viem.sh)

## Support

For issues or questions:

1. Check this documentation
2. Review component code comments
3. Check browser console for errors
4. Review contract deployment logs

## License

MIT License
