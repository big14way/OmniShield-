# Hedera Testnet Deployment Summary

## Deployment Details

**Network:** Hedera Testnet
**Chain ID:** 296
**RPC Endpoint:** https://testnet.hashio.io/api
**Block Explorer:** https://hashscan.io/testnet

## Deployed Contracts

### Core Contracts

| Contract        | Address                                      | HashScan Link                                                                                       |
| --------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| RiskEngine      | `0x22753E4264FDDc6181dc7cce468904A80a363E44` | [View on HashScan](https://hashscan.io/testnet/contract/0x22753E4264FDDc6181dc7cce468904A80a363E44) |
| InsurancePool   | `0xA7c59f010700930003b33aB25a7a0679C860f29c` | [View on HashScan](https://hashscan.io/testnet/contract/0xA7c59f010700930003b33aB25a7a0679C860f29c) |
| ClaimsProcessor | `0xfaAddC93baf78e89DCf37bA67943E1bE8F37Bb8c` | [View on HashScan](https://hashscan.io/testnet/contract/0xfaAddC93baf78e89DCf37bA67943E1bE8F37Bb8c) |
| HederaBridge    | `0x276C216D241856199A83bf27b2286659e5b877D3` | [View on HashScan](https://hashscan.io/testnet/contract/0x276C216D241856199A83bf27b2286659e5b877D3) |

## Configuration

### WalletConnect Integration

**Project ID:** `1eebe528ca0ce94a99ceaa2e915058d7`

The frontend is configured to support WalletConnect v2 for connecting to Hedera wallets including:

- HashPack
- Blade Wallet
- Kabila Wallet

### Frontend Configuration

The following environment variables have been set:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=1eebe528ca0ce94a99ceaa2e915058d7
NEXT_PUBLIC_HEDERA_RPC_URL=https://testnet.hashio.io/api
NEXT_PUBLIC_HEDERA_INSURANCE_POOL=0xA7c59f010700930003b33aB25a7a0679C860f29c
NEXT_PUBLIC_HEDERA_RISK_ENGINE=0x22753E4264FDDc6181dc7cce468904A80a363E44
```

## Contract Interactions

### InsurancePool Functions

- `createPolicy(uint256 coverageAmount, uint256 duration)` - Create a new insurance policy
- `calculatePremium(uint256 coverageAmount, uint256 duration)` - Calculate premium for coverage
- `submitClaim(uint256 policyId, uint256 claimAmount)` - Submit a claim
- `totalPoolBalance()` - View total pool balance

### RiskEngine Functions

- `calculateRiskScore(uint256 coverageAmount, uint256 duration, address user)` - Calculate risk score for underwriting

## Testing the Deployment

### Using the Frontend

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies (if not already installed):

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Connect your Hedera wallet (HashPack, Blade, etc.) via WalletConnect

5. Switch to Hedera Testnet (Chain ID: 296)

6. Interact with the deployed contracts

### Using Hardhat Console

```bash
npx hardhat console --network hedera-testnet
```

Then in the console:

```javascript
const InsurancePool = await ethers.getContractAt(
  "InsurancePool",
  "0xA7c59f010700930003b33aB25a7a0679C860f29c"
);
const balance = await InsurancePool.totalPoolBalance();
console.log("Pool Balance:", ethers.formatEther(balance), "HBAR");
```

## Verification

To verify contracts on HashScan:

```bash
npx hardhat verify --network hedera-testnet 0x22753E4264FDDc6181dc7cce468904A80a363E44
npx hardhat verify --network hedera-testnet 0xA7c59f010700930003b33aB25a7a0679C860f29c 0x22753E4264FDDc6181dc7cce468904A80a363E44
npx hardhat verify --network hedera-testnet 0xfaAddC93baf78e89DCf37bA67943E1bE8F37Bb8c 0xA7c59f010700930003b33aB25a7a0679C860f29c
npx hardhat verify --network hedera-testnet 0x276C216D241856199A83bf27b2286659e5b877D3
```

## Best Practices Implemented

✅ **Secure Configuration**

- Environment variables for sensitive data
- WalletConnect project ID properly configured
- RPC endpoint using official HashIO relay

✅ **Network Configuration**

- Proper chain ID (296 for Hedera Testnet)
- Gas limits configured for Hedera (15M gas)
- Timeout settings for network latency

✅ **Frontend Integration**

- WalletConnect v2 for broad wallet support
- Multi-chain configuration (Sepolia, Hedera)
- Contract addresses properly typed and validated

✅ **Development Workflow**

- Contracts compiled and deployed successfully
- Deployment addresses saved in environment files
- Frontend configuration updated automatically

## Next Steps

1. **Add Liquidity**: Fund the InsurancePool with HBAR for payouts
2. **Test Coverage Purchase**: Create test policies through the frontend
3. **Monitor Transactions**: Use HashScan to track all contract interactions
4. **Integrate Pyth Oracle**: Deploy and configure Pyth price feeds for Hedera
5. **Production Deployment**: Deploy to Hedera Mainnet (Chain ID: 295) when ready

## Support & Resources

- **Hedera Documentation**: https://docs.hedera.com
- **HashIO RPC Relay**: https://swirldslabs.com/hashio/
- **WalletConnect Docs**: https://docs.walletconnect.com
- **HashScan Explorer**: https://hashscan.io

---

**Deployment Date:** 2025-10-17
**Deployer Account:** 0.0.5785411
**Network:** Hedera Testnet
