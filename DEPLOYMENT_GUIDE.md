# OmniShield Deployment Guide

Complete guide for deploying OmniShield to Hedera and other networks.

## 📋 Prerequisites

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Hedera Account

1. **Create a Hedera Testnet Account**
   - Go to [Hedera Portal](https://portal.hedera.com)
   - Create a new testnet account
   - Save your Account ID and Private Key

2. **Fund Your Account**
   - Get testnet HBAR from [Hedera Faucet](https://portal.hedera.com/faucet)
   - Minimum recommended: 100 HBAR for deployment

### 3. Configure Environment Variables

Copy the `.env.example` to `.env`:

```bash
cp .env.example .env
```

**Required for Hedera Deployment:**

```env
# Hedera Credentials
HEDERA_ACCOUNT_ID=0.0.xxxxx          # Your Hedera account ID
HEDERA_PRIVATE_KEY=302e...           # Your Hedera private key (DER format)
HEDERA_OPERATOR_KEY=302e...          # Same as HEDERA_PRIVATE_KEY

# RPC URL
HEDERA_TESTNET_RPC_URL=https://testnet.hashio.io/api

# Deployer Private Key (Ethereum format, without 0x)
PRIVATE_KEY=your_ethereum_private_key_here
```

**Optional for Other Networks:**

```env
# Ethereum Sepolia
ETHEREUM_SEPOLIA_RPC_URL=https://rpc.sepolia.org
ETHERSCAN_API_KEY=your_etherscan_api_key

# Polygon Amoy
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

## 🚀 Deployment Steps

### Step 1: Compile Contracts

```bash
npm run compile
```

This will:

- Compile all Solidity contracts
- Generate TypeScript typings
- Create contract size report

### Step 2: Deploy to Hedera Testnet

```bash
npm run deploy:hedera
```

This will deploy:

- ✅ RiskEngine
- ✅ InsurancePool
- ✅ HederaInsurancePool (Hedera-specific version)
- ✅ HederaBridge
- ✅ PythPriceConsumer (if oracle configured)

**Expected Output:**

```
🚀 Deploying to Hedera Testnet...

📋 Deploying RiskEngine...
✅ RiskEngine deployed to: 0x...

📋 Deploying InsurancePool...
✅ InsurancePool deployed to: 0x...

📋 Deploying HederaInsurancePool...
✅ HederaInsurancePool deployed to: 0x...

💾 Deployment saved to: deployments/hedera-testnet.json

✅ Deployment complete!
```

### Step 3: Verify Deployment

Check the deployment file:

```bash
cat deployments/hedera-testnet.json
```

Should contain:

```json
{
  "insurancePool": "0x...",
  "riskEngine": "0x...",
  "hederaInsurancePool": "0x...",
  "hederaBridge": "0x...",
  "deployedAt": 1704067200000,
  "chainId": 296,
  "network": "hedera-testnet"
}
```

### Step 4: Update Frontend Configuration

Copy the deployed addresses to your frontend `.env`:

```bash
# Update frontend/.env.local
NEXT_PUBLIC_HEDERA_INSURANCE_POOL=0x...  # From deployment file
NEXT_PUBLIC_HEDERA_RISK_ENGINE=0x...
```

### Step 5: Test Deployment

Run a test transaction:

```bash
# Test coverage purchase
npx hardhat run scripts/test-deployment.ts --network hedera-testnet
```

## 🌐 Multi-Chain Deployment

### Deploy to All Networks

```bash
NETWORKS=sepolia,hedera,polygon npm run deploy:all
```

This will:

1. Deploy to each network sequentially
2. Configure cross-chain CCIP bridges (Sepolia ↔ Polygon)
3. Save deployment addresses per network
4. Generate deployment summary

### Verify All Contracts

```bash
NETWORKS=sepolia,polygon npm run verify:all
```

Note: Hedera verification is done through HashScan explorer.

## 🔧 Configuration

### Gas Settings

Adjust gas settings in `.env`:

```env
GAS_PRICE=50000000000  # 50 gwei
GAS_LIMIT=8000000      # 8M gas
```

### Hedera-Specific Settings

In `hardhat.config.ts`, Hedera configuration:

```typescript
"hedera-testnet": {
  url: process.env.HEDERA_TESTNET_RPC_URL,
  accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  chainId: 296,
  timeout: 60000,
}
```

## 📊 Post-Deployment Tasks

### 1. Initialize Price Feeds

```bash
npx hardhat run scripts/initialize-pyth.ts --network hedera-testnet
```

### 2. Set Up Governance

```bash
# Transfer ownership to multisig
NETWORK=hedera-testnet ACTION=transfer \
RECIPIENT=0xYourMultisigAddress \
CONFIRM_EMERGENCY=yes \
npx hardhat run scripts/emergency/withdraw-funds.ts --network hedera-testnet
```

### 3. Configure Frontend

Update `frontend/src/lib/web3/contracts.ts`:

```typescript
export const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  [hederaTestnet.id]: {
    insurancePool: "0x...", // From deployment file
    riskEngine: "0x...",
    pythPriceConsumer: "0x...",
  },
};
```

### 4. Test End-to-End

```bash
# Run E2E tests
npm run test:e2e
```

## 🚨 Troubleshooting

### Issue: "Insufficient HBAR balance"

**Solution:**

- Fund your Hedera account from the [faucet](https://portal.hedera.com/faucet)
- Minimum 100 HBAR recommended for deployment

### Issue: "Account not found"

**Solution:**

- Verify `HEDERA_ACCOUNT_ID` is correct (format: 0.0.xxxxx)
- Check that account exists on testnet

### Issue: "Invalid private key"

**Solution:**

- Hedera private key should be in DER format (starts with 302e)
- Remove any "0x" prefix from Ethereum private keys

### Issue: "Transaction timeout"

**Solution:**

- Increase timeout in `hardhat.config.ts`
- Check Hedera testnet status: https://status.hedera.com

### Issue: "Contract deployment failed"

**Solution:**

1. Check contract size (max 24KB)
   ```bash
   npm run size
   ```
2. Optimize contracts if needed
3. Check gas limits

## 📝 Deployment Checklist

Before deploying to mainnet:

- [ ] ✅ Tested on Hedera testnet
- [ ] ✅ All tests passing
- [ ] ✅ Contracts verified
- [ ] ✅ Security audit completed
- [ ] ✅ Frontend tested with testnet
- [ ] ✅ Emergency procedures documented
- [ ] ✅ Multisig set up for upgrades
- [ ] ✅ Monitoring configured
- [ ] ✅ Insurance pool funded
- [ ] ✅ Price feeds initialized

## 🔐 Security Recommendations

### 1. Private Key Management

- **Never commit** `.env` file to git
- Use hardware wallet for mainnet
- Store backups securely offline
- Use different keys for testnet/mainnet

### 2. Multisig for Production

```bash
# Set up Gnosis Safe multisig
# Transfer ownership after deployment
NETWORK=hedera-testnet ACTION=transfer \
RECIPIENT=0xMultisigAddress \
CONFIRM_EMERGENCY=yes \
npx hardhat run scripts/emergency/withdraw-funds.ts --network hedera-testnet
```

### 3. Access Control

- Only owner can pause contracts
- Only owner can upgrade (with multisig)
- Emergency functions protected

### 4. Monitoring

- Set up Sentry for error tracking
- Monitor contract balances
- Track deployment events
- Set up alerts for critical operations

## 📚 Additional Resources

- [Hedera Documentation](https://docs.hedera.com)
- [HashScan Explorer](https://hashscan.io/testnet)
- [Hedera Portal](https://portal.hedera.com)
- [Hardhat Hedera Plugin](https://www.npmjs.com/package/@hashgraph/hardhat-hethers)

## 🆘 Support

For deployment issues:

1. Check [Troubleshooting](#-troubleshooting) section
2. Review deployment logs
3. Check Hedera testnet status
4. Consult Hedera Discord: https://hedera.com/discord

## 📞 Emergency Contacts

In case of production issues:

1. **Pause contracts immediately**

   ```bash
   NETWORK=hedera-testnet ACTION=pause \
   REASON="Emergency" CONFIRM_EMERGENCY=yes \
   npm run emergency:pause
   ```

2. **Contact team**
   - Emergency email: [your-email]
   - Discord: [your-discord]
   - Phone: [emergency-number]

## 🎉 Next Steps After Deployment

1. **Update Frontend**
   - Deploy frontend to Vercel
   - Update contract addresses
   - Test all user flows

2. **Initialize Protocol**
   - Add initial liquidity
   - Set up price feeds
   - Test coverage purchase

3. **Marketing & Launch**
   - Announce on social media
   - Update documentation
   - Onboard first users

---

**Ready to deploy? Start with Step 1!** 🚀
