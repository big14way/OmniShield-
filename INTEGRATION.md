# OmniShield Integration Guide

## Current Status

### ✅ What's Complete

- Smart contracts compiled
- Frontend application built
- Web3 integration configured
- Build scripts ready

### ❌ What's Missing

- Contracts not deployed to testnet
- Frontend contract addresses are placeholders (all zeros)
- Frontend `.env.local` file missing
- No live contract interaction

## Quick Setup (3 Steps)

### Step 1: Deploy Contracts

```bash
# Ensure you have testnet ETH in your wallet
# Get Sepolia ETH from: https://sepoliafaucet.com/

# Deploy to Sepolia testnet
npm run deploy:sepolia

# This will create: deployments/sepolia.json
```

### Step 2: Update Frontend

```bash
# Run the integration script (creates frontend .env.local automatically)
npm run integrate

# Or manually:
./setup-frontend.sh
```

### Step 3: Start Frontend

```bash
cd frontend
npm run dev

# Open http://localhost:3000
```

## Detailed Setup

### Prerequisites

1. **Testnet ETH** - Get from https://sepoliafaucet.com/
2. **WalletConnect Project ID** - Get from https://cloud.walletconnect.com/
3. **Alchemy API Key** (optional) - Get from https://www.alchemy.com/

### Environment Setup

#### Backend (.env)

```bash
# Required for deployment
PRIVATE_KEY=your_private_key_here
ALCHEMY_API_KEY=your_alchemy_key

# Optional for verification
ETHERSCAN_API_KEY=your_etherscan_key
```

#### Frontend (.env.local)

Will be auto-created by integration script, or manually:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_SEPOLIA_INSURANCE_POOL=0x...deployed_address
NEXT_PUBLIC_SEPOLIA_RISK_ENGINE=0x...deployed_address
NEXT_PUBLIC_SEPOLIA_PYTH_CONSUMER=0x...deployed_address
```

### Deployment Process

#### Option 1: Automated (Recommended)

```bash
# Full deployment + integration
npm run integrate

# This will:
# 1. Deploy contracts to Sepolia
# 2. Save addresses to deployments/sepolia.json
# 3. Update frontend/src/lib/web3/contracts.ts
# 4. Create frontend/.env.local
# 5. Verify contracts (if ETHERSCAN_API_KEY set)
```

#### Option 2: Manual

```bash
# 1. Deploy contracts
npm run deploy:sepolia

# 2. Run integration helper
node scripts/integration/update-frontend.js

# 3. Create frontend .env.local
cp frontend/.env.example frontend/.env.local
# Edit and add contract addresses from deployments/sepolia.json
```

### Verify Deployment

```bash
# Check deployment status
cat deployments/sepolia.json

# Should show:
# {
#   "insurancePool": "0x...",
#   "riskEngine": "0x...",
#   "claimsProcessor": "0x...",
#   "pythPriceConsumer": "0x...",
#   "deployedAt": 1234567890,
#   "chainId": 11155111,
#   "network": "ethereum-sepolia"
# }
```

### Frontend Integration

#### Contract Addresses

Edit `frontend/src/lib/web3/contracts.ts`:

```typescript
export const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  [sepolia.id]: {
    insurancePool: "0xYourDeployedAddress", // From deployments/sepolia.json
    riskEngine: "0xYourRiskEngineAddress",
    pythPriceConsumer: "0xYourPythAddress",
  },
};
```

#### Environment Variables

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_SEPOLIA_INSURANCE_POOL=0x...
NEXT_PUBLIC_SEPOLIA_RISK_ENGINE=0x...
```

### Testing the Integration

#### 1. Check Smart Contracts

```bash
# Verify on Etherscan
npm run verify:sepolia

# Check pool balance
npx hardhat run scripts/monitor/dashboard.ts --network ethereum-sepolia
```

#### 2. Test Frontend

```bash
cd frontend
npm run dev

# Open http://localhost:3000
# Connect wallet (MetaMask)
# Try creating a policy
```

#### 3. Run Demo

```bash
# Test full flow with demo script
npm run demo:sepolia
```

## Common Issues & Solutions

### Issue 1: "Insufficient funds"

**Problem:** Deployer account has no Sepolia ETH

**Solution:**

```bash
# Get testnet ETH from faucet
# https://sepoliafaucet.com/
# https://faucet.quicknode.com/ethereum/sepolia
```

### Issue 2: "Contract addresses are all zeros"

**Problem:** Contracts not deployed or addresses not updated

**Solution:**

```bash
# 1. Deploy contracts
npm run deploy:sepolia

# 2. Update frontend
npm run integrate

# 3. Restart frontend
cd frontend && npm run dev
```

### Issue 3: "WalletConnect project ID not configured"

**Problem:** Missing WalletConnect project ID

**Solution:**

```bash
# 1. Get project ID from https://cloud.walletconnect.com/
# 2. Add to frontend/.env.local:
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### Issue 4: "Cannot read properties of undefined"

**Problem:** Frontend trying to access contracts before deployment

**Solution:**

```bash
# Ensure contracts are deployed first
npm run deploy:sepolia

# Check deployment file exists
ls -la deployments/sepolia.json

# Update frontend
npm run integrate
```

### Issue 5: "Network mismatch"

**Problem:** Wallet on wrong network

**Solution:**

- Open MetaMask
- Switch to Sepolia Test Network
- If not available, add manually:
  - Network Name: Sepolia
  - RPC URL: https://rpc.sepolia.org
  - Chain ID: 11155111
  - Currency: ETH

## Development Workflow

### Local Development

```bash
# 1. Start local Hardhat network
npm run node

# 2. Deploy locally (in another terminal)
npm run deploy:local

# 3. Start frontend
cd frontend && npm run dev
```

### Testnet Development

```bash
# 1. Deploy to Sepolia
npm run deploy:sepolia

# 2. Update frontend
npm run integrate

# 3. Start frontend
cd frontend && npm run dev

# 4. Monitor
npm run monitor
```

### Production Preparation

```bash
# 1. Full build
./build-mvp.sh

# 2. Validate MVP
npm run validate-mvp

# 3. Run demo
npm run demo

# 4. Deploy to multiple chains
npm run deploy:all
```

## Network Information

### Sepolia Testnet

- **Chain ID:** 11155111
- **RPC URL:** https://rpc.sepolia.org
- **Explorer:** https://sepolia.etherscan.io
- **Faucet:** https://sepoliafaucet.com/

### Hedera Testnet

- **Chain ID:** 296
- **RPC URL:** https://testnet.hashio.io/api
- **Explorer:** https://hashscan.io/testnet
- **Faucet:** https://portal.hedera.com

### Polygon Amoy Testnet

- **Chain ID:** 80002
- **RPC URL:** https://rpc-amoy.polygon.technology
- **Explorer:** https://www.oklink.com/amoy
- **Faucet:** https://faucet.polygon.technology/

## Monitoring & Debugging

### Check Deployment Status

```bash
# List deployments
ls -la deployments/

# View deployment details
cat deployments/sepolia.json | jq

# Check contract on Etherscan
# https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS
```

### Monitor Pool Activity

```bash
# Real-time monitoring
npm run monitor

# Continuous monitoring
npm run monitor:continuous
```

### Debug Frontend

```bash
# Check console in browser DevTools
# Look for:
# - Wallet connection status
# - Contract read/write errors
# - Network ID matches

# Enable verbose logging in frontend
# Edit frontend/src/lib/web3/hooks.ts
# Add console.log statements
```

## Architecture Overview

```
┌─────────────────────────────────────────┐
│           User's Wallet                  │
│        (MetaMask/WalletConnect)         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Frontend (Next.js)               │
│  ┌────────────────────────────────────┐ │
│  │  Wagmi + Viem (Web3 Library)      │ │
│  │  Contract ABIs & Addresses        │ │
│  └────────────────────────────────────┘ │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      Sepolia Testnet (Ethereum)         │
│  ┌────────────────────────────────────┐ │
│  │  InsurancePool Contract            │ │
│  │  RiskEngine Contract               │ │
│  │  ClaimsProcessor Contract          │ │
│  │  PythPriceConsumer Contract        │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Next Steps

1. ✅ Deploy contracts to Sepolia
2. ✅ Update frontend with addresses
3. ✅ Test wallet connection
4. ✅ Create a test policy
5. ✅ Submit a test claim
6. ✅ Add liquidity to pool
7. ✅ Monitor pool activity
8. ✅ Deploy to additional networks (Hedera, Polygon)

## Support

For issues:

- Check [README.md](./README.md)
- Review [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- Check [BUILD.md](./BUILD.md)
- Open GitHub issue

---

**Ready to integrate? Run: `npm run integrate` 🚀**
