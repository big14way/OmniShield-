# OmniShield Protocol

A comprehensive DeFi insurance protocol with cross-chain support, built on Ethereum, Polygon, and Hedera networks.

## Features

- **Insurance Pool Management**: Create and manage insurance policies with customizable coverage
- **Risk Engine**: Advanced risk assessment and premium calculation
- **Claims Processing**: Automated claims submission and approval workflow
- **Cross-Chain Support**:
  - CCIP integration for cross-chain messaging
  - Hedera bridge for asset transfers
- **Oracle Integration**: Pyth Network price feeds for real-time data
- **Multi-Network Deployment**: Support for Ethereum, Polygon, and Hedera testnets

## Project Structure

```
.
├── contracts/
│   ├── core/                  # Core protocol contracts
│   │   ├── InsurancePool.sol
│   │   ├── RiskEngine.sol
│   │   └── ClaimsProcessor.sol
│   ├── interfaces/            # Contract interfaces
│   ├── libraries/             # Utility libraries
│   ├── oracles/               # Oracle integrations
│   └── crosschain/            # Cross-chain components
├── scripts/
│   ├── deploy/                # Deployment scripts
│   └── verify/                # Verification scripts
├── test/
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   └── e2e/                   # End-to-end tests
└── tasks/                     # Hardhat tasks

```

## Getting Started

### Prerequisites

- Node.js v18 or later
- npm or yarn
- A wallet with testnet funds

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
```

### Configuration

Update `.env` with your keys:

```env
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
ALCHEMY_API_KEY=your_alchemy_api_key
HEDERA_ACCOUNT_ID=0.0.xxxxx
```

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Generate coverage report
npm run coverage
```

### Deploy

```bash
# Deploy to local network
npm run deploy:local

# Deploy to Ethereum Sepolia
npm run deploy:sepolia

# Deploy to Polygon Amoy
npm run deploy:polygon

# Deploy to Hedera Testnet
npm run deploy:hedera
```

### Verify Contracts

```bash
# Verify on Etherscan (Sepolia)
npm run verify:sepolia

# Verify on Polygonscan (Amoy)
npm run verify:polygon

# Verify on Hashscan (Hedera)
npm run verify:hedera
```

## Smart Contracts

### Core Contracts

- **InsurancePool**: Main contract for policy creation and management
- **RiskEngine**: Risk assessment and eligibility verification
- **ClaimsProcessor**: Claims submission and approval workflow

### Libraries

- **PremiumMath**: Premium calculation utilities
- **RiskCalculations**: Risk scoring algorithms

### Oracles

- **PythPriceConsumer**: Integration with Pyth Network price feeds

### Cross-Chain

- **CCIPReceiver**: Chainlink CCIP message receiver
- **HederaBridge**: Bridge for Hedera network integration

## Networks

### Ethereum Sepolia

- Chain ID: 11155111
- RPC: Via Alchemy

### Polygon Amoy

- Chain ID: 80002
- RPC: https://rpc-amoy.polygon.technology

### Hedera Testnet

- Chain ID: 296
- RPC: https://testnet.hashio.io/api

## Development Tools

- **Hardhat**: Development environment
- **TypeScript**: Type-safe scripting
- **OpenZeppelin**: Secure contract libraries
- **Ethers.js v6**: Ethereum interaction
- **Hardhat Toolbox**: Testing and deployment utilities

## Gas Optimization

```bash
# Generate gas report
npm run gas-report

# Check contract sizes
npm run size
```

## Security

- All contracts inherit from OpenZeppelin's secure base contracts
- ReentrancyGuard protection on sensitive functions
- Pausable functionality for emergency stops
- Access control with Ownable pattern

## License

MIT

## Contributing

Contributions are welcome! Please follow the standard fork-and-pull-request workflow.

## Support

For questions or issues, please open an issue on GitHub.
