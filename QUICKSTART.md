# OmniShield Quick Start Guide

🚀 **Get your DeFi insurance app running in 5 minutes!**

## Prerequisites

✅ Node.js 18+ installed  
✅ MetaMask wallet installed  
✅ Sepolia testnet ETH ([Get from faucet](https://sepoliafaucet.com/))

## 3-Step Setup

### Step 1: Install & Build

```bash
# Clone and install
git clone https://github.com/big14way/OmniShield-.git
cd OmniShield-
npm install

# Compile contracts
npm run compile
```

### Step 2: Deploy & Integrate

```bash
# Setup .env file
cp .env.example .env

# Add your private key to .env:
# PRIVATE_KEY=your_private_key_here
# ALCHEMY_API_KEY=your_alchemy_key (optional)

# Deploy contracts and update frontend (all-in-one)
npm run integrate

# Or run separately:
npm run deploy:sepolia
npm run integrate:quick
```

### Step 3: Start Frontend

```bash
cd frontend
npm install
npm run dev

# Open http://localhost:3000
```

## What You Get

After setup, you'll have:

✅ Smart contracts deployed to Sepolia testnet  
✅ Frontend connected to deployed contracts  
✅ Fully functional DeFi insurance app  
✅ MetaMask integration working

## Using the App

### 1. Connect Wallet

- Click "Connect Wallet" button
- Select MetaMask
- Approve connection
- Ensure you're on Sepolia network

### 2. Purchase Coverage

- Navigate to main page
- Select coverage amount (e.g., 1 ETH)
- Choose duration (30/60/90 days)
- Premium will be calculated automatically
- Click "Purchase Coverage"
- Approve transaction in MetaMask

### 3. Add Liquidity (Optional)

- Go to "Liquidity" page
- Enter amount to provide
- Click "Add Liquidity"
- Earn rewards from premiums (80% to LPs)

### 4. Submit Claims (If needed)

- Go to "Claims" page
- Select your policy
- Submit claim with evidence
- Wait for approval

## Quick Commands

```bash
# Development
npm run compile          # Compile contracts
npm test                 # Run tests
npm run coverage         # Test coverage

# Deployment
npm run deploy:sepolia   # Deploy to Sepolia
npm run deploy:hedera    # Deploy to Hedera
npm run deploy:polygon   # Deploy to Polygon

# Integration
npm run integrate        # Deploy + Update frontend
npm run setup:frontend   # Setup frontend only

# Frontend
cd frontend && npm run dev    # Start dev server
cd frontend && npm run build  # Build production

# Demo
npm run demo             # Run automated demo
npm run demo:sepolia     # Run demo on Sepolia

# Monitoring
npm run monitor          # Monitor pool activity
npm run validate-mvp     # Validate MVP checklist
```

## Troubleshooting

### "Insufficient funds for intrinsic transaction cost"

**Fix:** Get Sepolia ETH from faucet

- https://sepoliafaucet.com/
- https://faucet.quicknode.com/ethereum/sepolia

### "Contract not deployed"

**Fix:** Run deployment

```bash
npm run deploy:sepolia
npm run integrate:quick
```

### "Cannot connect to MetaMask"

**Fix:** Ensure MetaMask is installed and unlocked

- Install: https://metamask.io/
- Add Sepolia network if missing
- Switch to Sepolia network

### "Frontend shows zero addresses"

**Fix:** Update frontend with deployed addresses

```bash
npm run integrate:quick
# or
./setup-frontend.sh
```

### "Network mismatch"

**Fix:** Switch MetaMask to Sepolia

- Open MetaMask
- Click network dropdown
- Select "Sepolia Test Network"

## Advanced Features

### Multi-Chain Deployment

```bash
# Deploy to all chains
DEPLOY_TESTNET=1 npm run deploy:all

# Update frontend for each
NETWORK=sepolia npm run integrate:quick
NETWORK=hedera npm run integrate:quick
```

### Monitoring & Analytics

```bash
# Real-time monitoring
npm run monitor:continuous

# Get pool stats
npx hardhat run scripts/monitor/dashboard.ts --network ethereum-sepolia
```

### Security Setup

```bash
# Setup multi-sig and timelocks
npm run security:full-setup

# Configure emergency pause
npm run security:setup-pause
```

## Architecture

```
┌─────────────────┐
│   User Wallet   │  (MetaMask)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Frontend      │  (Next.js + Wagmi)
│  localhost:3000 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Smart Contracts │  (Sepolia Testnet)
│  - InsurancePool│
│  - RiskEngine   │
│  - ClaimsProc   │
└─────────────────┘
```

## File Structure

```
OmniShield/
├── contracts/           # Solidity smart contracts
├── scripts/
│   ├── deploy/         # Deployment scripts
│   ├── integration/    # Frontend integration
│   ├── monitor/        # Monitoring tools
│   └── demo/           # Demo scripts
├── frontend/           # Next.js application
│   ├── src/
│   │   ├── app/       # Pages
│   │   ├── components/# React components
│   │   └── lib/       # Web3 integration
│   └── .env.local     # Frontend config
├── test/               # Contract tests
├── deployments/        # Deployed addresses
└── .env               # Backend config
```

## Environment Variables

### Backend (.env)

```bash
PRIVATE_KEY=your_private_key_here
ALCHEMY_API_KEY=your_alchemy_key
ETHERSCAN_API_KEY=your_etherscan_key
```

### Frontend (.env.local)

Auto-generated by `npm run integrate`, or manually:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_SEPOLIA_INSURANCE_POOL=0x...
NEXT_PUBLIC_SEPOLIA_RISK_ENGINE=0x...
```

## Next Steps

1. ✅ [Run the automated demo](./scripts/demo/README.md)
2. ✅ [Read full integration guide](./INTEGRATION.md)
3. ✅ [Check deployment guide](./DEPLOYMENT_GUIDE.md)
4. ✅ [Review build process](./BUILD.md)

## Support

- 📚 [Full Documentation](./README.md)
- 🐛 [Report Issues](https://github.com/big14way/OmniShield-/issues)
- 💬 [Discussions](https://github.com/big14way/OmniShield-/discussions)

## Demo

Want to see it in action first?

```bash
# Run automated 3-minute demo
npm run demo

# On testnet with real transactions
npm run demo:sepolia
```

---

**Ready to build? Start with:** `npm run integrate` 🚀
