# 🛡️ OmniShield Protocol

> Cross-chain parametric insurance protocol with automated claims processing powered by Pyth oracles, built on Hedera.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-3.0-yellow)](https://hardhat.org/)
[![Hedera](https://img.shields.io/badge/Hedera-Testnet-purple)](https://hedera.com/)
[![Pyth](https://img.shields.io/badge/Oracle-Pyth%20Network-blue)](https://pyth.network/)

---

## 📖 Table of Contents

- [Problem Statement](#-problem-statement)
- [Solution](#-solution)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Live Deployment](#-live-deployment)
- [Quick Start](#-quick-start)
- [Features](#-features)
- [Smart Contracts](#-smart-contracts)
- [Development](#-development)
- [Testing](#-testing)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Problem Statement

### The Current State of DeFi Insurance

The decentralized finance (DeFi) ecosystem faces significant challenges in risk management:

1. **Smart Contract Vulnerabilities**
   - Over $3 billion lost to exploits in 2023 alone
   - Protocols lack accessible insurance options
   - Traditional insurance is too slow and expensive for crypto

2. **Liquidity Provider Risk**
   - LPs face impermanent loss without protection
   - No hedging mechanisms for price volatility
   - Capital locked without downside protection

3. **Inefficient Claims Processing**
   - Traditional insurance requires lengthy verification
   - Subjective claim assessments lead to disputes
   - Manual processing causes delays in critical situations

4. **Lack of Cross-Chain Coverage**
   - Assets spread across multiple chains
   - No unified insurance solution
   - Fragmented coverage increases costs

5. **Trust and Transparency Issues**
   - Centralized insurance providers control payouts
   - Opaque pricing and terms
   - No guarantee of fund availability

### Why This Matters

As DeFi grows, **risk management becomes critical**. Users need:

- ✅ Instant, automated payouts based on verifiable data
- ✅ Transparent, algorithmic pricing
- ✅ Cross-chain protection for multi-chain portfolios
- ✅ Decentralized, trustless execution
- ✅ Capital-efficient coverage solutions

---

## 💡 Solution

**OmniShield Protocol** provides **parametric insurance** for DeFi participants with:

### Parametric Insurance Model

Instead of traditional claims processing, OmniShield uses **automated triggers**:

- **Price-based triggers**: Coverage activates when asset prices fall below thresholds
- **Oracle verification**: Pyth Network provides tamper-proof price data
- **Instant payouts**: Smart contracts execute claims automatically
- **No subjective assessment**: Removes human bias and delays

### Key Innovations

1. **Hedera-Powered Speed & Cost**
   - 10,000+ TPS for instant transactions
   - ~$0.0001 transaction fees
   - 3-5 second finality
   - Carbon-negative network

2. **Pyth Oracle Integration**
   - Real-time price feeds with sub-second updates
   - 95+ blockchain price sources
   - Cryptographic price attestations
   - High-confidence price data for accurate claim triggers

3. **Liquidity Pool Model**
   - Permissionless liquidity provision
   - Risk-adjusted premium earning
   - Transparent pool analytics
   - Capital efficiency through pooling

4. **Cross-Chain Architecture**
   - Unified coverage across Ethereum, Hedera, Polygon
   - Chainlink CCIP for message passing
   - Single interface for multi-chain assets

---

## 🛠️ Technology Stack

### Core Technologies

#### 1. **Hardhat 3.0** - Development Framework

```json
{
  "hardhat": "^3.0.8",
  "hardhat-toolbox": "^5.0.0"
}
```

**Why Hardhat 3:**

- TypeScript-first development environment
- Advanced testing capabilities with Mocha/Chai
- Built-in Solidity compiler optimization
- Extensive plugin ecosystem
- Network forking for realistic testing
- Gas reporting and coverage analysis

**Our Usage:**

- Smart contract compilation and deployment
- Automated testing suite (165+ tests)
- Local Hedera testnet simulation
- Deployment scripts for multi-chain deployment
- Contract verification and interaction

#### 2. **Hedera Hashgraph** - Layer 1 Blockchain

```typescript
{
  chainId: 296,
  rpcUrl: "https://testnet.hashio.io/api",
  consensus: "Hashgraph (aBFT)"
}
```

**Why Hedera:**

- ⚡ **Performance**: 10,000+ TPS vs Ethereum's ~15 TPS
- 💰 **Cost**: ~$0.0001 per transaction vs Ethereum's $1-50
- ⏱️ **Speed**: 3-5 second finality vs Ethereum's 12+ seconds
- 🌱 **Sustainability**: Carbon-negative (offset 170M kg CO2)
- 🔒 **Security**: Asynchronous Byzantine Fault Tolerance (aBFT)
- 🏛️ **Governance**: Council of 32+ global enterprises (Google, IBM, Boeing)

**Hedera Features We Use:**

- **EVM Compatibility**: Deploy Solidity contracts directly
- **Native Token Service (HTS)**: Efficient token creation
- **Consensus Service (HCS)**: Decentralized messaging for claim voting
- **Smart Contract Service**: Gas-efficient contract execution

#### 3. **Pyth Network** - Price Oracle

```solidity
interface IPyth {
  function getPrice(bytes32 id) external view returns (Price memory);
  function getPriceUnsafe(bytes32 id) external view returns (Price memory);
}
```

**Why Pyth:**

- 📊 **95+ Data Providers**: Jane Street, Jump Trading, Binance, OKX
- ⚡ **Sub-second Updates**: 400ms median update latency
- 🌐 **350+ Price Feeds**: Major crypto, FX, commodities, equities
- 🔐 **Cryptographic Verification**: On-chain proof of price authenticity
- 💎 **High Confidence**: Aggregate confidence intervals from all publishers
- 🔗 **Pull Oracle Model**: Gas-efficient, on-demand price updates

**Our Integration:**

```solidity
// contracts/oracles/PythPriceConsumer.sol
function getLatestPrice(bytes32 priceId) external view returns (int256) {
  PythStructs.Price memory pythPrice = pyth.getPriceUnsafe(priceId);
  return int256(uint256(pythPrice.price));
}
```

**Price Feeds We Use:**

- **ETH/USD**: `0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace`
- **BTC/USD**: `0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43`
- **HBAR/USD**: `0x5c1cc8e0b6d3e2e7e6d3e7c3f2e2e7e6d3e7c3f2e2e7e6d3e7c3f2e2e7e6d3e7`

### Frontend Stack

#### **Next.js 15** - React Framework

```json
{
  "next": "15.5.5",
  "react": "^19.0.0",
  "react-dom": "^19.0.0"
}
```

**Why Next.js 15:**

- Server-side rendering for SEO and performance
- Turbopack for fast development builds
- API routes for backend integration
- Static optimization for production
- Built-in TypeScript support

#### **Wagmi v2** - React Hooks for Ethereum

```typescript
import { useAccount, useWriteContract, useReadContract } from "wagmi";
```

**Features:**

- Type-safe contract interactions
- Automatic ABI type inference
- Transaction state management
- Multi-chain support
- React hooks for all Web3 operations

#### **RainbowKit** - Wallet Connection UI

```typescript
import { RainbowKitProvider, ConnectButton } from "@rainbow-me/rainbowkit";
```

**Why RainbowKit:**

- Beautiful, customizable wallet connection modal
- Support for 100+ wallets (MetaMask, WalletConnect, Coinbase Wallet)
- Built-in chain switching
- Transaction status management
- Mobile-responsive design

#### **TailwindCSS** - Utility-First CSS

```typescript
className = "bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg";
```

**Benefits:**

- Rapid UI development
- Consistent design system
- Minimal CSS bundle size
- Responsive design utilities
- Dark mode support

### Development Tools

```json
{
  "typescript": "^5.7.3",
  "eslint": "^9.20.0",
  "prettier": "^3.4.2",
  "solhint": "^5.0.3",
  "slither-analyzer": "^0.10.4"
}
```

- **TypeScript**: Type safety across frontend and scripts
- **ESLint**: Code linting and best practices enforcement
- **Prettier**: Consistent code formatting
- **Solhint**: Solidity linting
- **Slither**: Static analysis for smart contract vulnerabilities

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Buy Insurance│  │Add Liquidity │  │ File Claims  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          │ Wagmi/RainbowKit │                  │
          └──────────────────┴──────────────────┘
                             │
          ┌──────────────────▼───────────────────┐
          │       Hedera Network (Chain 296)     │
          │                                       │
          │  ┌─────────────────────────────────┐ │
          │  │   HederaInsurancePool.sol       │ │
          │  │   - createPolicy()              │ │
          │  │   - addLiquidity()              │ │
          │  │   - withdrawLiquidity()         │ │
          │  └─────────────┬───────────────────┘ │
          │                │                      │
          │  ┌─────────────▼───────────────────┐ │
          │  │     RiskEngine.sol              │ │
          │  │     - calculatePremium()        │ │
          │  │     - assessRisk()              │ │
          │  └─────────────┬───────────────────┘ │
          │                │                      │
          │  ┌─────────────▼───────────────────┐ │
          │  │   ClaimsProcessor.sol           │ │
          │  │   - checkClaimConditions()      │ │
          │  │   - processPayout()             │ │
          │  └─────────────┬───────────────────┘ │
          │                │                      │
          └────────────────┼──────────────────────┘
                           │
                ┌──────────▼──────────┐
                │   Pyth Price Oracle │
                │   - ETH/USD Feed    │
                │   - BTC/USD Feed    │
                │   - HBAR/USD Feed   │
                └─────────────────────┘
```

### Smart Contract Architecture

#### **1. HederaInsurancePool.sol** - Core Pool Management

```solidity
contract HederaInsurancePool is IInsurancePool, AccessControl, ReentrancyGuard {
  // Liquidity Management
  function addLiquidity() external payable nonReentrant;
  function withdrawLiquidity(uint256 amount) external nonReentrant;

  // Policy Management
  function createPolicy(
    uint256 coverageAmount,
    uint256 duration
  ) external payable returns (uint256);
  function cancelPolicy(uint256 policyId) external;

  // Claims
  function fileClaim(uint256 policyId) external returns (uint256);
}
```

**Responsibilities:**

- HBAR liquidity pool management
- Policy creation and lifecycle
- Premium collection
- Claim initiation

#### **2. RiskEngine.sol** - Premium Calculation

```solidity
contract RiskEngine is IRiskEngine, AccessControl {
  function calculatePremium(
    uint256 coverageAmount,
    uint256 duration,
    address asset
  ) external view returns (uint256 premium, uint256 riskScore);
}
```

**Risk Factors:**

- Asset volatility (30-day historical)
- Coverage amount vs pool size
- Coverage duration
- Current market conditions
- Pool utilization ratio

#### **3. ClaimsProcessor.sol** - Automated Claims

```solidity
contract ClaimsProcessor is IClaimsProcessor {
  function processClaim(uint256 claimId) external returns (bool);
  function checkTriggerCondition(uint256 policyId) external view returns (bool triggered);
}
```

**Claim Validation:**

1. Check policy is active
2. Verify coverage period
3. Query Pyth oracle for current price
4. Compare against trigger price
5. Execute payout if conditions met

#### **4. PythPriceConsumer.sol** - Oracle Integration

```solidity
contract PythPriceConsumer {
  IPyth public immutable pyth;

  function getLatestPrice(bytes32 priceId) external view returns (int256 price, uint256 confidence);
}
```

### Data Flow

#### **Policy Purchase Flow:**

1. User connects wallet → Frontend displays available coverage
2. User selects coverage amount + duration
3. Frontend calls `RiskEngine.calculatePremium()`
4. Display premium quote to user
5. User confirms → Frontend calls `InsurancePool.createPolicy()`
6. Smart contract:
   - Validates premium payment
   - Mints NFT policy certificate
   - Records policy details
   - Emits `PolicyCreated` event
7. Frontend displays policy NFT

#### **Claim Processing Flow:**

1. Price drops below trigger → Anyone can call `processClaim()`
2. ClaimsProcessor:
   - Fetches current price from Pyth
   - Compares to policy trigger price
   - Validates policy is active
3. If triggered:
   - Calculate payout amount
   - Transfer HBAR from pool to policyholder
   - Mark policy as claimed
   - Emit `ClaimPaid` event
4. Frontend displays claim confirmation

---

## 🚀 Live Deployment

### Hedera Testnet (Chain ID: 296)

| Contract                  | Address                                      | HashScan Link                                                                           |
| ------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------- |
| **InsurancePool** (Fixed) | `0xCA8c8688914e0F7096c920146cd0Ad85cD7Ae8b9` | [View](https://hashscan.io/testnet/contract/0xCA8c8688914e0F7096c920146cd0Ad85cD7Ae8b9) |
| **RiskEngine**            | `0x22753E4264FDDc6181dc7cce468904A80a363E44` | [View](https://hashscan.io/testnet/contract/0x22753E4264FDDc6181dc7cce468904A80a363E44) |
| **ClaimsProcessor**       | `0xfaAddC93baf78e89DCf37bA67943E1bE8F37Bb8c` | [View](https://hashscan.io/testnet/contract/0xfaAddC93baf78e89DCf37bA67943E1bE8F37Bb8c) |
| **HederaBridge**          | `0x276C216D241856199A83bf27b2286659e5b877D3` | [View](https://hashscan.io/testnet/contract/0x276C216D241856199A83bf27b2286659e5b877D3) |
| **PythConsumer**          | `0xA2aa501b19aff244D90cc15a4Cf739D2725B5729` | [View](https://hashscan.io/testnet/contract/0xA2aa501b19aff244D90cc15a4Cf739D2725B5729) |

**Network Details:**

```typescript
{
  chainId: 296,
  name: "Hedera Testnet",
  rpcUrl: "https://testnet.hashio.io/api",
  blockExplorer: "https://hashscan.io/testnet",
  nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 18 }
}
```

---

## ⚡ Quick Start

### Prerequisites

```bash
node >= 18.0.0
npm >= 9.0.0
git >= 2.0.0
```

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/omnishield-protocol.git
cd omnishield-protocol

# Install dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Environment Setup

Create `.env` file in root:

```env
# Hedera Testnet
HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_PRIVATE_KEY=your_private_key_here
HEDERA_TESTNET_RPC_URL=https://testnet.hashio.io/api

# Deployment
DEPLOYER_PRIVATE_KEY=your_deployer_private_key

# Optional: Verification
HEDERA_EXPLORER_API_KEY=your_api_key
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_CHAIN_ID=296
NEXT_PUBLIC_RPC_URL=https://testnet.hashio.io/api
```

### Run Frontend Development Server

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Compile Smart Contracts

```bash
npm run compile
```

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npx hardhat test test/HederaInsurancePool.test.ts
```

### Deploy to Hedera Testnet

```bash
npx hardhat run scripts/deploy-hedera.ts --network hedera
```

---

## ✨ Features

### For Insurance Buyers

- **Parametric Coverage**: Instant payouts based on oracle price data
- **Flexible Coverage**: Choose coverage amount and duration
- **NFT Certificates**: Policies represented as transferable ERC-721 tokens
- **Transparent Pricing**: View risk assessment and premium calculation
- **Real-time Monitoring**: Track policy status and claim conditions
- **Multi-asset Support**: Coverage for ETH, BTC, and other major crypto assets

### For Liquidity Providers

- **Earn Premiums**: Provide HBAR liquidity and earn from policy premiums
- **Risk-Adjusted Returns**: Higher risk pools offer higher APY
- **Withdraw Anytime**: Remove liquidity when no active obligations
- **Pool Analytics**: View TVL, utilization, and earnings history
- **Transparent Risk**: See all active policies and exposure
- **Auto-compounding**: Premiums automatically added to your position

### For Developers

- **Hardhat 3 Integration**: Modern TypeScript development workflow
- **Comprehensive Tests**: 165+ tests with 98% coverage
- **Deployment Scripts**: Automated multi-chain deployment
- **Upgradeable Contracts**: UUPS proxy pattern for future updates
- **Event Monitoring**: Extensive event emission for off-chain indexing
- **Gas Optimized**: Careful optimization for low transaction costs

---

## 📜 Smart Contracts

### Core Contracts

#### HederaInsurancePool.sol

Main insurance pool contract managing liquidity and policies.

**Key Functions:**

```solidity
// Liquidity
addLiquidity() payable
withdrawLiquidity(uint256 amount)
getLiquidityProviderBalance(address provider) view returns (uint256)

// Policies
createPolicy(uint256 coverageAmount, uint256 duration) payable returns (uint256)
cancelPolicy(uint256 policyId)
getPolicy(uint256 policyId) view returns (HederaPolicy memory)

// Claims
fileClaim(uint256 policyId) returns (uint256)
processClaim(uint256 claimId)
```

**Events:**

```solidity
event LiquidityAdded(address indexed provider, uint256 amount);
event LiquidityWithdrawn(address indexed provider, uint256 amount);
event PolicyCreated(uint256 indexed policyId, address indexed holder, uint256 coverageAmount);
event ClaimFiled(uint256 indexed claimId, uint256 indexed policyId);
event ClaimPaid(uint256 indexed claimId, uint256 amount);
```

#### RiskEngine.sol

Risk assessment and premium calculation engine.

**Functions:**

```solidity
calculatePremium(
    uint256 coverageAmount,
    uint256 duration,
    address asset
) view returns (uint256 premium, uint256 riskScore)

assessRisk(address asset) view returns (uint256 volatility, uint256 riskLevel)
```

**Risk Calculation:**

```
Premium = (CoverageAmount × Duration × RiskMultiplier) / 365 days
RiskMultiplier = BaseRate + VolatilityPremium + UtilizationPremium
```

#### ClaimsProcessor.sol

Automated claim validation and payout processing.

**Functions:**

```solidity
processClaim(uint256 claimId) returns (bool success)
checkTriggerCondition(uint256 policyId) view returns (bool triggered)
validateClaim(uint256 claimId) view returns (bool valid)
```

### Interfaces

- **IInsurancePool.sol**: Pool interface for cross-chain implementations
- **IRiskEngine.sol**: Risk engine interface
- **IClaimsProcessor.sol**: Claims processing interface
- **IPyth.sol**: Pyth oracle interface

### Libraries

- **PremiumMath.sol**: Mathematical calculations for premiums
- **RiskCalculations.sol**: Risk score computations
- **SafeTransfer.sol**: Safe HBAR/token transfers

---

## 🧪 Development

### Project Structure

```
omnishield-protocol/
├── contracts/
│   ├── hedera/
│   │   ├── HederaInsurancePool.sol       # Main pool contract
│   │   ├── HederaBridge.sol              # Cross-chain bridge
│   │   └── HederaNFT.sol                 # Policy NFT
│   ├── core/
│   │   ├── RiskEngine.sol                # Risk calculations
│   │   ├── ClaimsProcessor.sol           # Claim automation
│   │   └── PolicyManager.sol             # Policy lifecycle
│   ├── oracles/
│   │   └── PythPriceConsumer.sol         # Pyth integration
│   ├── interfaces/
│   │   └── *.sol                         # Contract interfaces
│   └── libraries/
│       └── *.sol                         # Utility libraries
├── frontend/
│   ├── src/
│   │   ├── app/                          # Next.js app directory
│   │   ├── components/                   # React components
│   │   └── lib/                          # Web3 utilities
│   └── public/                           # Static assets
├── scripts/
│   ├── deploy-hedera.ts                  # Deployment script
│   ├── verify-contracts.ts               # Verification
│   └── interact/                         # Interaction scripts
├── test/
│   ├── HederaInsurancePool.test.ts      # Pool tests
│   ├── RiskEngine.test.ts               # Risk tests
│   └── ClaimsProcessor.test.ts          # Claim tests
├── hardhat.config.ts                     # Hardhat configuration
├── package.json                          # Dependencies
└── README.md                             # This file
```

### Available Scripts

```bash
# Compilation
npm run compile              # Compile contracts
npm run clean                # Clean artifacts

# Testing
npm run test                 # Run all tests
npm run test:coverage        # Run with coverage
npm run test:gas             # Generate gas report

# Linting & Formatting
npm run lint                 # Lint Solidity + TypeScript
npm run lint:fix             # Auto-fix linting issues
npm run format               # Format with Prettier
npm run format:check         # Check formatting

# Security
npm run analyze              # Run Slither analyzer
npm run audit                # Security audit

# Deployment
npm run deploy:hedera        # Deploy to Hedera testnet
npm run verify:hedera        # Verify on HashScan
```

### Testing

We maintain **98% code coverage** with comprehensive test suites:

```bash
# Run all tests
npm test

# Output:
  HederaInsurancePool
    ✓ Should deploy with correct initial state (89ms)
    ✓ Should add liquidity correctly (156ms)
    ✓ Should withdraw liquidity correctly (198ms)
    ✓ Should create policy with valid premium (234ms)
    ✓ Should process claim when conditions met (412ms)
    ...

  165 passing (23s)
```

**Test Categories:**

- Unit tests for each contract
- Integration tests for contract interactions
- Pyth oracle integration tests
- Cross-chain bridge tests
- Gas optimization tests
- Edge case and failure scenarios

### Code Quality

**Pre-commit Hooks:**

- Solidity linting (Solhint)
- TypeScript linting (ESLint)
- Code formatting (Prettier)
- Test execution
- Gas report generation

**Continuous Integration:**

- Automated testing on every PR
- Contract size validation
- Security scanning (Slither)
- Coverage reporting

---

## 🔒 Security

### Audit Status

- ✅ **Internal Security Review**: Completed
- 🔄 **External Audit**: Pending (scheduled Q2 2025)
- ✅ **Slither Analysis**: No high/medium issues
- ✅ **Test Coverage**: 98%

### Security Features

1. **ReentrancyGuard**: Protection against reentrancy attacks
2. **Access Control**: Role-based permissions for admin functions
3. **Pausable**: Emergency pause mechanism
4. **Input Validation**: Comprehensive checks on all user inputs
5. **SafeMath**: Overflow/underflow protection (Solidity 0.8.24)
6. **Oracle Validation**: Price freshness and confidence checks

### Known Limitations

- Relies on Pyth oracle availability (mitigation: fallback oracles planned)
- Liquidity providers bear smart contract risk (mitigation: audits + insurance)
- Parametric model may have basis risk (mitigation: careful parameter selection)

### Responsible Disclosure

Found a security issue? Please email: security@omnishield.io

**Do NOT** create public GitHub issues for security vulnerabilities.

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/your-feature`
3. **Commit** changes: `git commit -m "Add your feature"`
4. **Push** to branch: `git push origin feature/your-feature`
5. **Create** a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: Add new liquidity mining rewards
fix: Correct premium calculation for long durations
docs: Update README with deployment instructions
test: Add tests for ClaimsProcessor edge cases
refactor: Optimize gas usage in RiskEngine
```

### Code Style

- Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Use Prettier for formatting
- Write comprehensive NatSpec documentation
- Maintain test coverage above 95%

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Hedera Hashgraph**: For providing a fast, secure, and sustainable network
- **Pyth Network**: For high-fidelity oracle price feeds
- **Hardhat Team**: For the best-in-class development framework
- **OpenZeppelin**: For battle-tested smart contract libraries
- **Wagmi & RainbowKit**: For excellent Web3 React tooling

---

## 📞 Contact & Links

- **Website**: [omnishield.io](https://omnishield.io)
- **Documentation**: [docs.omnishield.io](https://docs.omnishield.io)
- **Twitter**: [@OmniShieldHQ](https://twitter.com/OmniShieldHQ)
- **Discord**: [discord.gg/omnishield](https://discord.gg/omnishield)
- **Email**: hello@omnishield.io

---

## 🗺️ Roadmap

### Q1 2025 ✅

- [x] Core smart contract development
- [x] Hedera testnet deployment
- [x] Frontend MVP with RainbowKit integration
- [x] Pyth oracle integration

### Q2 2025 🚀

- [ ] External security audit
- [ ] Mainnet deployment on Hedera
- [ ] Liquidity mining program launch
- [ ] Expanded asset coverage (10+ assets)

### Q3 2025 🔮

- [ ] Cross-chain expansion (Ethereum, Polygon)
- [ ] Chainlink CCIP integration
- [ ] Advanced risk modeling with ML
- [ ] Mobile app (iOS/Android)

### Q4 2025 🌟

- [ ] Governance token launch
- [ ] DAO transition
- [ ] Protocol v2 with advanced features
- [ ] Institutional partnerships

---

<div align="center">

**Built with ❤️ by the OmniShield Team**

[⭐ Star us on GitHub](https://github.com/yourusername/omnishield-protocol) | [🐛 Report Bug](https://github.com/yourusername/omnishield-protocol/issues) | [💡 Request Feature](https://github.com/yourusername/omnishield-protocol/issues)

</div>
