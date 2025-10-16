# OmniShield Deployment & Management Scripts

Comprehensive deployment and emergency response scripts for the OmniShield protocol.

## 📁 Directory Structure

```
scripts/
├── deploy/
│   ├── deploy-all-chains.ts    # Multi-chain deployment
│   ├── deploy-hedera.ts         # Hedera-specific deployment
│   ├── deploy.ts                # Single network deployment
│   ├── verify-all.ts            # Verification across networks
│   └── upgrade-contracts.ts     # Contract upgrade management
│
└── emergency/
    ├── pause-all.ts             # Emergency pause mechanism
    └── withdraw-funds.ts        # Emergency fund management
```

## 🚀 Deployment Scripts

### Multi-Chain Deployment

Deploy to all configured networks in one command:

```bash
# Deploy to Sepolia only
NETWORKS=sepolia npx hardhat run scripts/deploy/deploy-all-chains.ts --network sepolia

# Deploy to multiple networks
NETWORKS=sepolia,polygon npx hardhat run scripts/deploy/deploy-all-chains.ts

# Full deployment with verification
NETWORKS=sepolia,hedera,polygon npm run deploy:all
```

**Environment Variables Required:**

```env
# Sepolia
ETHEREUM_SEPOLIA_CCIP_ROUTER=0x...
ETHEREUM_SEPOLIA_LINK_TOKEN=0x...
SEPOLIA_PYTH_ORACLE=0x2880aB155794e7179c9eE2e38200202908C17B43

# Polygon Amoy
POLYGON_AMOY_CCIP_ROUTER=0x...
POLYGON_AMOY_LINK_TOKEN=0x...
POLYGON_AMOY_PYTH_ORACLE=0x...

# Hedera Testnet
HEDERA_TESTNET_PYTH_ORACLE=0x...
```

**Output:**

- Deployment addresses saved to `/deployments/{network}.json`
- Summary report in `/deployments/DEPLOYMENT_SUMMARY.md`
- Cross-chain links automatically configured
- Pyth price feeds initialized

### Single Network Deployment

```bash
# Deploy to Sepolia
npm run deploy:sepolia

# Deploy to Hedera
npm run deploy:hedera

# Deploy to Polygon
npm run deploy:polygon
```

### Verification

Verify all deployed contracts:

```bash
# Verify all contracts on all networks
NETWORKS=sepolia,polygon npm run verify:all

# Verify specific network
NETWORK=sepolia npm run verify:sepolia
```

## 🔄 Contract Upgrades

### Validate Upgrade

Check if upgrade is safe before executing:

```bash
NETWORK=sepolia ACTION=validate CONTRACT=insurancePool \
npx hardhat run scripts/deploy/upgrade-contracts.ts --network sepolia
```

### Propose Upgrade (Multisig)

Prepare upgrade for multisig execution:

```bash
NETWORK=sepolia ACTION=propose CONTRACT=insurancePool \
MULTISIG_ADDRESS=0x... \
npx hardhat run scripts/deploy/upgrade-contracts.ts --network sepolia
```

### Execute Upgrade

Direct upgrade (requires owner access):

```bash
NETWORK=sepolia ACTION=upgrade CONTRACT=insurancePool \
CONFIRM_UPGRADE=yes \
npx hardhat run scripts/deploy/upgrade-contracts.ts --network sepolia
```

**Supported Contracts:**

- `insurancePool` - Upgrade InsurancePool implementation
- `riskEngine` - Upgrade RiskEngine implementation
- `all` - Upgrade all contracts

**Actions:**

- `validate` - Check upgrade compatibility
- `propose` - Prepare for multisig execution
- `upgrade` - Execute upgrade immediately
- `import` - Import existing proxy

**Upgrade Records:**

- Saved to `/deployments/upgrades/{network}-upgrades.json`
- Includes previous/new implementation addresses
- Timestamp and executor address
- Full audit trail

## 🚨 Emergency Response

### Emergency Pause

Immediately pause all contract operations:

```bash
NETWORK=sepolia ACTION=pause REASON="Security incident" \
CONFIRM_EMERGENCY=yes \
npx hardhat run scripts/emergency/pause-all.ts --network sepolia
```

**What it does:**

- Pauses InsurancePool (no new policies/claims)
- Pauses CCIP Bridge (no cross-chain transfers)
- Records emergency action with timestamp
- Saves action log to `/deployments/emergency/`

### Resume Operations

Unpause contracts after issue resolution:

```bash
NETWORK=sepolia ACTION=unpause \
CONFIRM_EMERGENCY=yes \
npx hardhat run scripts/emergency/pause-all.ts --network sepolia
```

### Check Contract Status

View current pause state:

```bash
NETWORK=sepolia ACTION=status \
npx hardhat run scripts/emergency/pause-all.ts --network sepolia
```

### Emergency Fund Management

Transfer ownership or manage funds:

```bash
# Transfer ownership to new address
NETWORK=sepolia ACTION=transfer RECIPIENT=0x... \
CONFIRM_EMERGENCY=yes \
npx hardhat run scripts/emergency/withdraw-funds.ts --network sepolia

# Check fund status
NETWORK=sepolia ACTION=status \
npx hardhat run scripts/emergency/withdraw-funds.ts --network sepolia
```

## 📦 Deployment Files

### Network Deployment JSON

`/deployments/{network}.json`:

```json
{
  "insurancePool": "0x...",
  "riskEngine": "0x...",
  "pythPriceConsumer": "0x...",
  "ccipBridge": "0x...",
  "deployedAt": 1704067200000,
  "chainId": 11155111,
  "network": "ethereum-sepolia"
}
```

### Upgrade Records

`/deployments/upgrades/{network}-upgrades.json`:

```json
[
  {
    "timestamp": 1704067200000,
    "previousImplementation": "0x...",
    "newImplementation": "0x...",
    "proxyAddress": "0x...",
    "contractName": "InsurancePool",
    "upgrader": "0x..."
  }
]
```

### Emergency Action Log

`/deployments/emergency/{network}-emergency.json`:

```json
[
  {
    "timestamp": 1704067200000,
    "action": "pause",
    "contract": "InsurancePool",
    "network": "sepolia",
    "executor": "0x...",
    "reason": "Security incident",
    "txHash": "0x..."
  }
]
```

## 🛡️ Safety Features

### Confirmation Requirements

All destructive actions require explicit confirmation:

- Upgrades: `CONFIRM_UPGRADE=yes`
- Emergency actions: `CONFIRM_EMERGENCY=yes`

### Deployment Checks

- Prevents re-deployment to already deployed networks
- Validates contract addresses before configuration
- Checks network compatibility
- Verifies Pyth oracle addresses

### Upgrade Safety

- OpenZeppelin upgrade validation
- Storage layout compatibility checks
- Previous implementation tracking
- Rollback capability through multisig

### Emergency Safeguards

- Owner-only access for critical functions
- Pause mechanism on all critical contracts
- Emergency action logging
- Multi-signature support

## 📊 Monitoring

### Deployment Status

Check what's deployed where:

```bash
# View deployment summary
cat deployments/DEPLOYMENT_SUMMARY.md

# Check specific network
cat deployments/sepolia.json
```

### Upgrade History

```bash
# View all upgrades for a network
cat deployments/upgrades/sepolia-upgrades.json
```

### Emergency Actions

```bash
# View emergency action history
cat deployments/emergency/sepolia-emergency.json
```

## 🔧 Development

### Adding New Networks

1. Add network to `hardhat.config.ts`
2. Add network config to `deploy-all-chains.ts`
3. Set environment variables
4. Run deployment

### Testing Deployment

```bash
# Deploy to local hardhat network first
npx hardhat node

# In another terminal
npx hardhat run scripts/deploy/deploy.ts --network localhost
```

### Testing Upgrades

```bash
# Validate on testnet first
NETWORK=sepolia ACTION=validate \
npx hardhat run scripts/deploy/upgrade-contracts.ts --network sepolia

# If validation passes, proceed
NETWORK=sepolia ACTION=upgrade CONFIRM_UPGRADE=yes \
npx hardhat run scripts/deploy/upgrade-contracts.ts --network sepolia
```

## 🚦 Workflow

### Production Deployment

1. **Test on Testnet**

   ```bash
   NETWORKS=sepolia npm run deploy:all
   ```

2. **Verify Contracts**

   ```bash
   NETWORKS=sepolia npm run verify:all
   ```

3. **Test Functionality**
   - Purchase coverage
   - Submit claim
   - Test cross-chain

4. **Deploy to Mainnet**

   ```bash
   NETWORKS=ethereum npm run deploy:all
   ```

5. **Initialize Frontend**
   - Update contract addresses in frontend
   - Deploy frontend
   - Test end-to-end

### Emergency Response

1. **Identify Issue**
   - Monitor alerts
   - Confirm threat

2. **Pause Operations**

   ```bash
   NETWORK=ethereum ACTION=pause CONFIRM_EMERGENCY=yes \
   npm run emergency:pause
   ```

3. **Investigate**
   - Analyze issue
   - Prepare fix

4. **Deploy Fix**

   ```bash
   NETWORK=ethereum ACTION=upgrade CONFIRM_UPGRADE=yes \
   npm run upgrade
   ```

5. **Resume Operations**
   ```bash
   NETWORK=ethereum ACTION=unpause CONFIRM_EMERGENCY=yes \
   npm run emergency:pause
   ```

## 📝 Best Practices

1. **Always test on testnet first**
2. **Use multisig for mainnet upgrades**
3. **Keep emergency keys secure and offline**
4. **Document all deployments and upgrades**
5. **Monitor contract events and balances**
6. **Have emergency response plan ready**
7. **Regular security audits**
8. **Gradual rollout to production**

## 🔗 Related Documentation

- [Hardhat Config](../../hardhat.config.ts)
- [Contract Documentation](../../contracts/README.md)
- [Frontend Setup](../../FRONTEND_SETUP.md)
- [Security Guidelines](../../SECURITY.md)

## 📞 Support

For deployment issues or emergencies:

1. Check deployment logs
2. Verify environment variables
3. Consult documentation
4. Contact development team
