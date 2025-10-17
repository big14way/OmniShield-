# 🛡️ OmniShield Protocol

> Cross-chain parametric insurance protocol with automated claims processing, built on Hedera, Ethereum, and Polygon networks.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Built%20with-Hardhat-yellow)](https://hardhat.org/)

## 🌟 Overview

OmniShield is a decentralized insurance protocol that provides parametric coverage for crypto assets across multiple blockchain networks. Users can purchase insurance policies, liquidity providers earn premiums, and claims are processed automatically using oracle price feeds.

### Key Features

- ⚡ **Instant Payouts** - Automated claim processing powered by Pyth price oracles
- 🌐 **Cross-Chain Coverage** - Seamless insurance across Ethereum, Hedera, and Polygon
- 🔒 **Transparent & Secure** - All terms encoded in audited smart contracts
- 💰 **Liquidity Mining** - Earn premiums by providing liquidity to insurance pools
- 📊 **Risk-Based Pricing** - Advanced risk engine for fair premium calculation
- 🎯 **NFT Certificates** - Coverage represented as transferable NFTs

## 🚀 Live Deployment

### Hedera Testnet (Chain ID: 296)

| Contract        | Address                                      | Explorer                                                                                |
| --------------- | -------------------------------------------- | --------------------------------------------------------------------------------------- |
| InsurancePool   | `0xA7c59f010700930003b33aB25a7a0679C860f29c` | [View](https://hashscan.io/testnet/contract/0xA7c59f010700930003b33aB25a7a0679C860f29c) |
| RiskEngine      | `0x22753E4264FDDc6181dc7cce468904A80a363E44` | [View](https://hashscan.io/testnet/contract/0x22753E4264FDDc6181dc7cce468904A80a363E44) |
| ClaimsProcessor | `0xfaAddC93baf78e89DCf37bA67943E1bE8F37Bb8c` | [View](https://hashscan.io/testnet/contract/0xfaAddC93baf78e89DCf37bA67943E1bE8F37Bb8c) |
| HederaBridge    | `0x276C216D241856199A83bf27b2286659e5b877D3` | [View](https://hashscan.io/testnet/contract/0x276C216D241856199A83bf27b2286659e5b877D3) |

**Frontend**: [OmniShield DApp](http://localhost:3000) (run locally)
**WalletConnect**: Integrated with Project ID ``

## 📋 Quick Start

### For Users

1. **Install a Hedera Wallet**
   - [HashPack](https://www.hashpack.app/)
   - [Blade Wallet](https://www.bladewallet.io/)
   - [Kabila Wallet](https://kabila.app/)

2. **Get Testnet HBAR**
   - Visit [Hedera Portal](https://portal.hedera.com)
   - Create testnet account
   - Get free testnet HBAR

3. **Run the Frontend**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Start Using**
   - Visit http://localhost:3000
   - Connect your Hedera wallet
   - Purchase insurance coverage or provide liquidity

📖 **Full Testing Guide**: See [FRONTEND_TESTING_GUIDE.md](FRONTEND_TESTING_GUIDE.md)

### For Developers

```bash
# Clone repository
git clone https://github.com/big14way/Omnishieldhackathon.git
cd Omnishieldhackathon

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your keys

# Compile contracts
npm run compile

# Run tests
npm test

# Deploy to Hedera testnet
npm run deploy:hedera

# Start frontend
cd frontend && npm install && npm run dev
```

## 🏗️ Architecture

### Smart Contracts

```
contracts/
├── core/
│   ├── InsurancePool.sol          # Main insurance pool logic
│   ├── RiskEngine.sol             # Risk assessment & pricing
│   ├── ClaimsProcessor.sol        # Claims handling
│   └── CoverageNFT.sol            # Policy NFT certificates
├── hedera/
│   ├── HederaInsurancePool.sol    # Hedera-specific pool with HTS
│   └── HederaBridge.sol           # Cross-chain bridge
├── crosschain/
│   └── CCIPCrossChainCoverage.sol # Chainlink CCIP integration
├── oracles/
│   ├── PythPriceConsumer.sol      # Pyth oracle integration
│   └── PythPriceFeeds.sol         # Price feed management
└── libraries/
    ├── PremiumMath.sol            # Premium calculations
    ├── RiskCalculations.sol       # Risk scoring
    └── PercentageMath.sol         # Percentage utilities
```

### Frontend Application

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Homepage
│   │   ├── coverage/             # Coverage purchase page
│   │   ├── liquidity/            # Liquidity pool page
│   │   └── claims/               # Claims center page
│   ├── components/
│   │   ├── coverage/             # Coverage components
│   │   ├── liquidity/            # Liquidity components
│   │   ├── claims/               # Claims components
│   │   └── layout/               # Layout components
│   └── lib/
│       ├── web3/
│       │   ├── config.ts         # Wagmi & network config
│       │   ├── contracts.ts      # Contract ABIs & addresses
│       │   └── hooks.ts          # Web3 React hooks
│       └── hooks/
│           └── usePrices.ts      # Price feed hooks
```

## 🔧 Technology Stack

### Smart Contracts

- **Solidity 0.8.24** - Smart contract language
- **Hardhat** - Development environment
- **OpenZeppelin** - Secure contract libraries
- **Ethers.js v6** - Ethereum interaction

### Blockchain Integrations

- **Hedera** - Low-cost, high-speed transactions with HTS tokens
- **Ethereum (Sepolia)** - EVM compatibility
- **Polygon (Amoy)** - Scalable L2 solution
- **Chainlink CCIP** - Cross-chain messaging
- **Pyth Network** - Real-time price oracles

### Frontend

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Wagmi** - React hooks for Ethereum
- **Viem** - Lightweight Ethereum library
- **WalletConnect v2** - Multi-wallet support
- **TailwindCSS** - Utility-first styling

## 📊 How It Works

### 1. Purchase Coverage

```mermaid
User → Frontend → InsurancePool
  → RiskEngine (Calculate Risk Score)
  → PythOracle (Get Asset Price)
  → Calculate Premium
  → Create Policy (mint NFT)
  → Transfer Premium to Pool
```

**Steps:**

1. User selects asset (ETH, BTC, HBAR), coverage amount, and duration
2. RiskEngine calculates risk score based on user history and market conditions
3. Premium calculated using risk score and coverage parameters
4. User pays premium, receives policy NFT
5. Funds added to liquidity pool

### 2. Provide Liquidity

```mermaid
Liquidity Provider → InsurancePool
  → Deposit ETH/USDC
  → Receive LP Tokens
  → Earn Premium Share (80%)
  → Withdraw Anytime (if not utilized)
```

**Steps:**

1. LP deposits assets to insurance pool
2. Receives LP tokens representing pool share
3. Earns 80% of all premiums collected
4. Can withdraw anytime (subject to pool utilization)

### 3. Submit Claim

```mermaid
User → ClaimsProcessor
  → Verify Policy Active
  → PythOracle (Check Price Drop)
  → Auto-Approve if Conditions Met
  → Transfer Payout from Pool
```

**Steps:**

1. User submits claim with policy ID
2. ClaimsProcessor verifies policy is active
3. Oracle checks if claim conditions met (e.g., 20% price drop)
4. If valid, payout automatically sent to user
5. Policy marked as claimed

### 4. Cross-Chain Coverage (Coming Soon)

```mermaid
User on Ethereum → CCIPBridge
  → Send Message via Chainlink CCIP
  → Hedera Receives Message
  → Create Coverage on Hedera
  → Confirmation Back to Ethereum
```

## 💻 Development

### Environment Setup

Create `.env` file:

```env
# Network RPC URLs
HEDERA_TESTNET_RPC_URL=https://testnet.hashio.io/api
ETHEREUM_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology

# Private Keys (DO NOT COMMIT)
PRIVATE_KEY=your_private_key_here

# Hedera Credentials
HEDERA_ACCOUNT_ID=0.0.xxxxx
HEDERA_PRIVATE_KEY=your_hedera_private_key
HEDERA_OPERATOR_KEY=your_operator_key

# API Keys
ETHERSCAN_API_KEY=your_etherscan_key
POLYGONSCAN_API_KEY=your_polygonscan_key
ALCHEMY_API_KEY=your_alchemy_key

# Frontend
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
```

### Available Commands

#### Contract Development

```bash
npm run compile          # Compile contracts
npm test                 # Run all tests
npm run test:unit        # Run unit tests
npm run test:integration # Run integration tests
npm run coverage         # Generate coverage report
npm run size             # Check contract sizes
npm run gas-report       # Generate gas report
npm run clean            # Clean artifacts
```

#### Deployment

```bash
npm run deploy:local     # Deploy to local Hardhat network
npm run deploy:sepolia   # Deploy to Ethereum Sepolia
npm run deploy:hedera    # Deploy to Hedera Testnet
npm run deploy:polygon   # Deploy to Polygon Amoy
npm run deploy:all       # Deploy to all networks
```

#### Verification

```bash
npm run verify:sepolia   # Verify on Etherscan
npm run verify:hedera    # Verify on HashScan
npm run verify:polygon   # Verify on PolygonScan
```

#### Frontend

```bash
cd frontend
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Lint code
```

#### Monitoring & Demo

```bash
npm run monitor          # Monitor pool activity
npm run demo             # Run automated demo
npm run validate-mvp     # Validate MVP checklist
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx hardhat test test/unit/InsurancePool.test.ts

# Run with gas reporting
REPORT_GAS=true npm test

# Run with coverage
npm run coverage
```

### Local Development

1. **Start local Hardhat node:**

   ```bash
   npm run node
   ```

2. **Deploy contracts locally:**

   ```bash
   npm run deploy:local
   ```

3. **Start frontend:**

   ```bash
   cd frontend
   npm run dev
   ```

4. **Connect MetaMask to localhost:8545**

## 🔐 Security

### Audits & Best Practices

- ✅ OpenZeppelin secure contract libraries
- ✅ ReentrancyGuard on all state-changing functions
- ✅ Pausable emergency stop mechanism
- ✅ Role-based access control (RBAC)
- ✅ Integer overflow protection (Solidity 0.8+)
- ✅ Input validation on all external functions
- ✅ CEI pattern (Checks-Effects-Interactions)

### Known Limitations

- Oracle dependency (single point of failure)
- Testnet deployments only (not production-ready)
- Limited claim types (parametric only)
- No governance mechanism yet

### Security Tools

```bash
# Run Slither static analysis
npm run security:slither

# Check contract sizes
npm run size

# Generate gas report
npm run gas-report
```

## 📈 Contract Specifications

### InsurancePool

**Key Functions:**

- `createPolicy(uint256 coverageAmount, uint256 duration)` - Create new insurance policy
- `calculatePremium(uint256 coverageAmount, uint256 duration)` - Calculate premium cost
- `submitClaim(uint256 policyId, uint256 claimAmount)` - Submit claim for payout
- `addLiquidity()` - Provide liquidity to pool
- `withdrawLiquidity(uint256 amount)` - Withdraw liquidity

**Events:**

- `PolicyCreated(uint256 indexed policyId, address indexed holder, uint256 coverageAmount, uint256 premium)`
- `ClaimSubmitted(uint256 indexed policyId, uint256 claimAmount)`
- `ClaimApproved(uint256 indexed policyId, uint256 payoutAmount)`
- `LiquidityAdded(address indexed provider, uint256 amount)`

### RiskEngine

**Key Functions:**

- `calculateRiskScore(uint256 coverageAmount, uint256 duration, address user)` - Calculate risk score
- `isEligibleForCoverage(address user)` - Check coverage eligibility

### ClaimsProcessor

**Key Functions:**

- `processClaim(uint256 policyId)` - Process submitted claim
- `approveClaim(uint256 policyId)` - Approve claim payout
- `rejectClaim(uint256 policyId, string memory reason)` - Reject claim

## 🌐 Multi-Chain Support

### Supported Networks

| Network          | Chain ID | RPC Endpoint                        | Status      |
| ---------------- | -------- | ----------------------------------- | ----------- |
| Hedera Testnet   | 296      | https://testnet.hashio.io/api       | ✅ Deployed |
| Ethereum Sepolia | 11155111 | Alchemy                             | 🔄 Ready    |
| Polygon Amoy     | 80002    | https://rpc-amoy.polygon.technology | 🔄 Ready    |
| Hedera Mainnet   | 295      | https://mainnet.hashio.io/api       | 📋 Planned  |

### Cross-Chain Features

- **Chainlink CCIP** - Cross-chain messaging for policy transfers
- **Hedera Bridge** - Native bridge for HTS token support
- **Unified Liquidity** - Share liquidity across networks (planned)

## 📱 Frontend Features

### User Dashboard

- View active policies
- Track claims history
- Monitor pool statistics
- Portfolio analytics

### Coverage Purchase Flow

1. Select asset (ETH, BTC, HBAR)
2. Choose coverage amount and duration
3. View calculated premium
4. Select coverage type (Price Protection, Smart Contract, Rug Pull)
5. Purchase with one click

### Liquidity Provision

- Real-time APY display
- Pool utilization metrics
- Instant deposit/withdrawal
- Earnings tracker

### Claims Center

- Active coverage overview
- One-click claim submission
- Real-time status updates
- Claims history table

## 🎯 Roadmap

### Phase 1: MVP (Current) ✅

- [x] Core insurance contracts
- [x] Hedera testnet deployment
- [x] Basic frontend (coverage, liquidity, claims)
- [x] WalletConnect integration
- [x] Premium calculation engine

### Phase 2: Oracle Integration 🔄

- [ ] Pyth price feeds integration
- [ ] Automated claim processing
- [ ] Real-time premium adjustments
- [ ] Multi-asset support

### Phase 3: Cross-Chain 📋

- [ ] Chainlink CCIP integration
- [ ] Multi-chain policy transfers
- [ ] Unified liquidity pools
- [ ] Cross-chain claims

### Phase 4: Advanced Features 📋

- [ ] DAO governance
- [ ] Staking mechanisms
- [ ] Advanced coverage types
- [ ] Mobile app
- [ ] Mainnet deployment

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow Solidity style guide
- Write comprehensive tests (>80% coverage)
- Document all public functions
- Run linter before committing
- Keep PRs focused and small

## 📄 Documentation

- [Frontend Testing Guide](FRONTEND_TESTING_GUIDE.md) - Complete testing checklist
- [Hedera Deployment](HEDERA_DEPLOYMENT.md) - Deployment details
- [Quick Start](QUICKSTART.md) - Get started in 5 minutes

## 📞 Support & Community

- **Issues**: [GitHub Issues](https://github.com/big14way/Omnishieldhackathon/issues)
- **Discussions**: [GitHub Discussions](https://github.com/big14way/Omnishieldhackathon/discussions)
- **Hedera Discord**: [Join](https://discord.gg/hedera)

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Hedera** - For the fast, low-cost network
- **Chainlink** - For CCIP cross-chain infrastructure
- **Pyth Network** - For real-time oracle price feeds
- **OpenZeppelin** - For secure contract libraries
- **Hardhat** - For excellent development tools

## ⚠️ Disclaimer

This is a hackathon project and is NOT production-ready. Use at your own risk. All deployments are on testnets only. Do not use with real funds.

---

**Built with ❤️ ETHOnline 2025 Hackathon**

[Live Demo](http://localhost:3000) | [Documentation](./docs) | [Report Bug](https://github.com/big14way/Omnishieldhackathon/issues) | [Request Feature](https://github.com/big14way/Omnishieldhackathon/issues)
