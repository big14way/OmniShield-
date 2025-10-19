# Liquidity Pool Fix Instructions

## Problem Identified

The deployed `HederaInsurancePool` contract at `0x525C7063E7C20997BaaE9bDa922159152D0e8417` **does not have liquidity pool functions**. This is why:

- ❌ `getLiquidityProviderBalance()` returns `undefined`
- ❌ `addLiquidity()` would fail
- ❌ `withdrawLiquidity()` would fail

The frontend expects these functions but they don't exist in the deployed contract.

## Solution

I've added the missing functions to `contracts/hedera/HederaInsurancePool.sol`:

### Added Functions:

1. ✅ `addLiquidity()` - payable, allows users to deposit HBAR
2. ✅ `withdrawLiquidity(uint256 amount)` - allows users to withdraw their HBAR
3. ✅ `getLiquidityProviderBalance(address provider)` - view function to check balance

### Added State:

- `mapping(address => uint256) private liquidityProviders` - tracks each provider's balance

### Added Events:

- `event LiquidityAdded(address indexed provider, uint256 amount)`
- `event LiquidityWithdrawn(address indexed provider, uint256 amount)`

## Deployment Steps

### Step 1: Compile the Updated Contract

```bash
cd /Users/user/gwill/web3/Omnishieldhackathon
npx hardhat compile
```

### Step 2: Deploy to Hedera Testnet

```bash
npx hardhat run scripts/deploy/deploy-hedera.ts --network hederaTestnet
```

**Save the new contract address** that gets printed!

### Step 3: Update Frontend Configuration

Edit `frontend/src/lib/web3/contracts.ts`:

```typescript
[hederaTestnet.id]: {
  insurancePool: "0xNEW_CONTRACT_ADDRESS_HERE", // Replace with new address
  riskEngine: "0x5bf5b11053e734690269C6B9D438F8C9d48F528A",
  claimsProcessor: "0x3aAde2dCD2Df6a8cAc689EE797591b2913658659",
  hederaBridge: "0xab16A69A5a8c12C732e0DEFF4BE56A70bb64c926",
  pythPriceConsumer: "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729",
},
```

### Step 4: Restart Frontend

```bash
cd frontend
rm -rf .next
npm run dev
```

### Step 5: Test Liquidity Functions

1. Connect wallet to Hedera Testnet
2. Click "Add Liquidity"
3. Enter amount (e.g., 10 HBAR)
4. Confirm transaction in MetaMask
5. Wait for confirmation (~3-5 seconds on Hedera)
6. Your balance should appear in "Liquidity Provided" section

## Alternative: Temporary UI Fix

If you don't want to redeploy right now, you can add a notice to the UI:

Edit `frontend/src/components/liquidity/LiquidityPool.tsx` to show:

```typescript
{isConnected && chain?.id === 296 && !userLiquidityBalance && (
  <div className="bg-yellow-50 border-2 border-yellow-300 p-6 rounded-xl">
    <h3 className="text-lg font-semibold text-yellow-800 mb-2">
      ⚠️ Liquidity Pool Unavailable
    </h3>
    <p className="text-gray-700">
      The liquidity pool feature is currently being upgraded.
      Please check back soon!
    </p>
  </div>
)}
```

## What Was Changed in the Contract

### File: `contracts/hedera/HederaInsurancePool.sol`

**Added state variable:**

```solidity
mapping(address => uint256) private liquidityProviders;
```

**Added events:**

```solidity
event LiquidityAdded(address indexed provider, uint256 amount);
event LiquidityWithdrawn(address indexed provider, uint256 amount);
```

**Added functions:**

```solidity
function addLiquidity() external payable nonReentrant {
  require(msg.value > 0, "Must send HBAR");
  liquidityProviders[msg.sender] += msg.value;
  totalPoolBalance += msg.value;
  emit LiquidityAdded(msg.sender, msg.value);
}

function withdrawLiquidity(uint256 amount) external nonReentrant {
  require(amount > 0, "Amount must be greater than 0");
  require(liquidityProviders[msg.sender] >= amount, "Insufficient liquidity balance");
  require(address(this).balance >= amount, "Insufficient pool balance");

  liquidityProviders[msg.sender] -= amount;
  if (totalPoolBalance >= amount) {
    totalPoolBalance -= amount;
  } else {
    totalPoolBalance = 0;
  }

  payable(msg.sender).transfer(amount);
  emit LiquidityWithdrawn(msg.sender, amount);
}

function getLiquidityProviderBalance(address provider) external view returns (uint256) {
  return liquidityProviders[provider];
}
```

## Next Steps

1. ✅ Contract code updated
2. ⏳ Compile and deploy to Hedera Testnet
3. ⏳ Update frontend contract address
4. ⏳ Test liquidity add/withdraw functionality

## Need Help?

If you encounter deployment issues, check:

- HBAR balance in deployer account (need ~50 HBAR for deployment)
- Hedera API keys in `.env` file
- Network connectivity to Hedera Testnet
