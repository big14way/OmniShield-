# OmniShield Build Guide

## Quick Start

```bash
# Full MVP build (includes tests, deployment, validation)
./build-mvp.sh

# Quick build (compile + test only)
./quick-build.sh
```

## Build Scripts

### 1. Master Build Script (`build-mvp.sh`)

Comprehensive 13-step build pipeline for hackathon submission:

```bash
./build-mvp.sh
```

**What it does:**

1. ✅ **Install Dependencies** - Installs all npm packages
2. ✅ **Compile Contracts** - Compiles Solidity smart contracts
3. ✅ **Run Tests** - Executes unit, integration, and E2E tests
4. ✅ **Check Coverage** - Generates test coverage report
5. ✅ **Security Analysis** - Runs Slither (if installed)
6. ✅ **Check Contract Sizes** - Validates bytecode sizes
7. ✅ **Deploy to Testnets** - Deploys contracts (optional)
8. ✅ **Verify Contracts** - Verifies on block explorers
9. ✅ **Build Frontend** - Compiles Next.js application
10. ✅ **Run E2E Tests** - End-to-end testing
11. ✅ **Generate Documentation** - Creates project docs
12. ✅ **Setup Demo** - Prepares demo environment
13. ✅ **Validate MVP** - Runs comprehensive validation

**Estimated time:** 5-10 minutes (depending on deployment)

### 2. Quick Build Script (`quick-build.sh`)

Fast iteration build for development:

```bash
./quick-build.sh
```

**What it does:**

- Compiles contracts
- Runs test suite
- Checks contract sizes

**Estimated time:** 1-2 minutes

## Environment Variables

### Required for Full Build

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

**Essential variables:**

```bash
# Deployment
PRIVATE_KEY=your_private_key_here
NETWORK=sepolia

# API Keys (for verification)
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key

# RPC URLs
ALCHEMY_API_KEY=your_alchemy_api_key
```

### Optional Build Flags

Control build behavior with environment variables:

```bash
# Skip testnet deployment
SKIP_DEPLOY=1 ./build-mvp.sh

# Enable testnet deployment
DEPLOY_TESTNET=1 ./build-mvp.sh

# Run specific network
NETWORK=polygon ./build-mvp.sh
```

## Build Stages

### Stage 1: Local Development

```bash
# Quick iterations
./quick-build.sh

# Run demo locally
npm run demo
```

### Stage 2: Testing

```bash
# Run all tests
npm test

# Coverage report
npm run coverage

# E2E tests
npm run test:e2e

# Validate MVP
npm run validate-mvp
```

### Stage 3: Testnet Deployment

```bash
# Deploy to Sepolia
npm run deploy:sepolia

# Deploy to all chains
npm run deploy:all

# Verify contracts
npm run verify:all
```

### Stage 4: Pre-Hackathon

```bash
# Full build
./build-mvp.sh

# Run demo
npm run demo

# Validate everything
npm run validate-mvp
```

## Common Issues

### "Command not found: hardhat"

**Solution:** Install dependencies

```bash
npm install
```

### "Insufficient funds" during deployment

**Solution:** Get testnet ETH from faucets

- Sepolia: https://sepoliafaucet.com/
- Polygon Amoy: https://faucet.polygon.technology/

### "Slither not found"

**Solution:** Install Slither (optional)

```bash
pip3 install slither-analyzer
pip3 install solc-select
solc-select install 0.8.24
solc-select use 0.8.24
```

### Build script hangs

**Solution:** Skip optional steps

```bash
SKIP_DEPLOY=1 ./build-mvp.sh
```

### Permission denied on scripts

**Solution:** Make scripts executable

```bash
chmod +x build-mvp.sh quick-build.sh
```

## CI/CD Integration

### GitHub Actions

Add to `.github/workflows/build.yml`:

```yaml
name: Build MVP

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Run Quick Build
        run: ./quick-build.sh

      - name: Upload Coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
```

### Pre-commit Hook

Automatically run quick build before commits:

```bash
# .husky/pre-commit
#!/bin/sh
./quick-build.sh
```

## Build Outputs

After successful build, you'll have:

```
📁 Project Root
├── 📁 artifacts/          # Compiled contracts
├── 📁 typechain-types/    # TypeScript types
├── 📁 coverage/           # Test coverage reports
│   └── index.html         # Coverage visualization
├── 📁 deployments/        # Deployment addresses
│   ├── sepolia.json
│   ├── polygon.json
│   └── hedera.json
├── 📁 docs/generated/     # Auto-generated documentation
├── 📁 frontend/.next/     # Built frontend
├── slither-report.json    # Security analysis
└── validation-report.json # MVP validation results
```

## NPM Scripts Reference

### Core Scripts

```bash
npm run compile           # Compile contracts
npm test                  # Run all tests
npm run coverage          # Generate coverage
npm run deploy:local      # Deploy locally
npm run demo              # Run demo
npm run validate-mvp      # Validate MVP
```

### Deployment Scripts

```bash
npm run deploy:sepolia    # Deploy to Sepolia
npm run deploy:hedera     # Deploy to Hedera
npm run deploy:polygon    # Deploy to Polygon
npm run deploy:all        # Deploy to all chains
```

### Monitoring Scripts

```bash
npm run monitor           # Monitor pools
npm run security:setup    # Security setup
npm run emergency:pause   # Emergency pause
```

### Documentation Scripts

```bash
npm run docs:generate     # Generate docs (if configured)
npm run audit:prepare     # Prepare audit package
```

## Performance Metrics

### Build Times (Approximate)

| Script                   | Time   | Description           |
| ------------------------ | ------ | --------------------- |
| `quick-build.sh`         | ~1-2m  | Essential checks only |
| `build-mvp.sh`           | ~5-10m | Full pipeline         |
| `npm test`               | ~30s   | All tests             |
| `npm run coverage`       | ~1m    | With coverage         |
| `npm run deploy:sepolia` | ~2-3m  | Single chain deploy   |
| `npm run demo`           | <3m    | Full demo             |

### Resource Usage

- **Disk space:** ~500MB (with node_modules)
- **Memory:** ~2GB peak during build
- **Network:** ~100MB downloads (first build)

## Troubleshooting

### Build Fails at Step X

Check the logs for specific error messages. Common solutions:

1. **Dependencies:** `rm -rf node_modules && npm install`
2. **Cache:** `npx hardhat clean`
3. **Environment:** Check `.env` file
4. **Network:** Ensure stable internet connection

### Tests Failing

```bash
# Run tests individually
npm run test:unit
npm run test:integration
npm run test:e2e

# Debug specific test
npx hardhat test test/unit/InsurancePool.test.ts
```

### Deployment Errors

```bash
# Check network configuration
npx hardhat run scripts/deploy/deploy.ts --network sepolia

# Verify manually
npx hardhat verify --network sepolia CONTRACT_ADDRESS [CONSTRUCTOR_ARGS]
```

## Best Practices

### Before Hackathon Submission

1. ✅ Run full build: `./build-mvp.sh`
2. ✅ Check validation: `npm run validate-mvp`
3. ✅ Test demo: `npm run demo`
4. ✅ Review coverage: `open coverage/index.html`
5. ✅ Deploy to testnet
6. ✅ Verify contracts
7. ✅ Update README with contract addresses

### During Development

1. Use `quick-build.sh` for rapid iteration
2. Run tests frequently: `npm test`
3. Check contract sizes: `npx hardhat size-contracts`
4. Monitor gas usage: `npm run gas-report`

### Before Commits

1. Run `quick-build.sh`
2. Format code: `npm run format`
3. Fix linting: `npm run lint:fix`
4. Update tests if needed

## Support

For issues or questions:

- Check [README.md](./README.md)
- Review [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- Open GitHub issue
- Check [scripts/README.md](./scripts/README.md)

---

**Ready to build? Run: `./build-mvp.sh` 🚀**
