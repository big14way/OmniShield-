# On-Chain Testing Guide - OmniShield

This guide will walk you through testing the OmniShield frontend to verify all interactions are on-chain and visible on HashScan.

## Prerequisites

### 1. Install Wallet

- **HashPack** (Recommended): https://www.hashpack.app/
- **Blade Wallet**: https://bladewallet.io/
- **MetaMask**: Can also be used with Hedera testnet

### 2. Get Test HBAR

You'll need test HBAR for transactions:

1. Visit Hedera Faucet: https://portal.hedera.com/faucet
2. Enter your Hedera account ID or EVM address
3. Receive free test HBAR (5 HBAR)

---

## Complete User Flow Testing

### Step 1: Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

### Step 2: Connect Your Wallet

1. Click **"Connect Wallet"** button in the top right
2. Select your wallet (HashPack, Blade, or MetaMask)
3. **IMPORTANT**: Make sure you're connected to **Hedera Testnet (Chain ID: 296)**
4. Approve the connection in your wallet

**Verification Point:**

- ✅ Your address should be displayed in the UI
- ✅ Your HBAR balance should be visible

---

## Test Flow 1: Purchase Insurance Coverage

### A. Navigate to Coverage Purchase

1. Go to `/coverage` or click "Purchase Coverage" in navigation
2. You should see the coverage purchase form

### B. Fill Coverage Details

1. **Select Asset**: Choose ETH, BTC, or HBAR
2. **Coverage Amount**: Enter amount (e.g., 10 ETH)
3. **Duration**: Use slider to select days (e.g., 30 days)
4. **Coverage Type**: Select "Price Protection" or "Smart Contract"

### C. Calculate Premium

- The premium should calculate automatically
- You'll see:
  - Coverage Amount in USD
  - Premium in HBAR/ETH
  - Duration

### D. Purchase Coverage

1. Click **"Purchase Coverage"** button
2. Your wallet will prompt for transaction approval
3. **Review Transaction Details:**
   - Contract: `0xA7c59f010700930003b33aB25a7a0679C860f29c` (InsurancePool)
   - Amount: Premium amount
   - Gas fee: ~0.001 HBAR

4. Approve the transaction in your wallet

### E. Verify Transaction On-Chain

**You should see:**

1. ⏳ **Pending Status**: "Processing transaction..." with spinner
2. 🔗 **Transaction Link**: Blue link showing tx hash (e.g., `0x1234...5678`)
3. ✅ **Success Status**: Green box with "Coverage purchased successfully!"

**Click the transaction link** - it should open HashScan:

```
https://hashscan.io/testnet/tx/0x[your-tx-hash]
```

**Verify on HashScan:**

- ✅ Transaction Status: Success
- ✅ From: Your address
- ✅ To: InsurancePool contract (`0xA7c59f010700930003b33aB25a7a0679C860f29c`)
- ✅ Value: Premium amount in HBAR
- ✅ Event Logs: Should show `PolicyCreated` event with:
  - `policyId`: Your policy ID number
  - `holder`: Your address
  - `coverageAmount`: Amount you insured
  - `premium`: Premium paid

**Take Note:**

- Copy the **Policy ID** from the event logs
- You'll need this for submitting claims

---

## Test Flow 2: View Your Active Policies

### A. Navigate to Claims Center

1. Go to `/claims` or click "Claims Center"
2. Wait for policies to load (you'll see "Loading..." indicator)

### B. Verify Your Policy Appears

You should see your purchased policy displayed as a card:

- **Coverage Amount**: 10 ETH (or what you purchased)
- **Coverage Period**: Start and end dates
- **Premium Paid**: Amount in ETH
- **Status**: Green "Active" badge

**This data is fetched from on-chain events!**

### C. Verify Data Matches HashScan

1. Go to HashScan contract page:
   ```
   https://hashscan.io/testnet/contract/0xA7c59f010700930003b33aB25a7a0679C860f29c
   ```
2. Click on **"Contract"** tab
3. Click **"Read Contract"**
4. Call `getPolicy` function with your Policy ID
5. **Compare:**
   - holder → Should match your address
   - coverageAmount → Should match UI
   - premium → Should match UI
   - startTime → Should match start date
   - endTime → Should match end date
   - active → Should be `true`

✅ **If everything matches, your UI is reading real on-chain data!**

---

## Test Flow 3: Submit a Claim

### A. Select Policy for Claim

1. In Claims Center, click **"Submit Claim"** on your active policy
2. The form will pre-fill with your Policy ID

### B. Enter Claim Details

1. **Policy ID**: Should be auto-filled (or enter manually)
2. **Claim Amount**: Enter amount to claim (e.g., 5 ETH)
3. Review policy details displayed:
   - Coverage Amount
   - Policy Status (should be "Active")

### C. Submit Claim Transaction

1. Click **"Submit Claim"** button
2. Wallet prompts for approval
3. **Review Transaction:**
   - Contract: InsurancePool
   - Function: `submitClaim`
   - Gas: ~0.001 HBAR

4. Approve transaction

### D. Verify Claim On-Chain

**You should see:**

1. ⏳ "Submitting claim..." with tx link
2. ✅ "Claim submitted successfully!" when confirmed

**Click transaction link to HashScan:**

```
https://hashscan.io/testnet/tx/0x[claim-tx-hash]
```

**Verify on HashScan:**

- ✅ Transaction Status: Success
- ✅ Function Called: `submitClaim(uint256,uint256)`
- ✅ Event Logs: `PolicyClaimed` event with:
  - `policyId`: Your policy ID
  - `amount`: Claim amount

### E. View Claim in History

1. Scroll down to **"Claims History"** table
2. Your claim should appear with:
   - Claim ID
   - Policy ID
   - Amount
   - Date
   - Status: "PENDING"

---

## Test Flow 4: Check Live Pyth Prices

### A. View Price Feed

1. Go to home page or any page showing asset prices
2. You should see real-time prices for:
   - BTC
   - ETH
   - HBAR
   - USDC

### B. Verify Prices are Live

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Look for requests to `/api/prices?symbols=ETH,BTC,HBAR`
4. Check the response - prices should have:
   - `price`: Current price
   - `change24h`: 24-hour change percentage
   - `lastUpdate`: Recent timestamp
   - `confidence`: Confidence interval

### C. Compare with Pyth Network

1. Visit Pyth Price Feeds: https://pyth.network/price-feeds
2. Find ETH/USD or BTC/USD
3. Compare prices - they should match (within confidence interval)

✅ **If prices update every 30 seconds and match Pyth, you're using live oracle data!**

---

## Test Flow 5: Cross-Chain Coverage (CCIP)

### A. Navigate to Cross-Chain Page

1. Go to `/crosschain`
2. You should see the Cross-Chain Coverage interface

### B. Select Destination Chain

1. Choose a destination chain (e.g., Ethereum Sepolia)
2. Select asset to cover
3. Enter coverage amount
4. Set duration

### C. Estimate CCIP Fee

- UI should show estimated CCIP bridge fee
- This is calculated based on:
  - Destination chain
  - Message size
  - Gas costs

### D. Send Cross-Chain Message

1. Click **"Purchase Cross-Chain Coverage"**
2. Approve transaction with CCIP fee included
3. Transaction will:
   - Lock funds on source chain
   - Send CCIP message to destination
   - Create coverage on destination chain

### E. Track Cross-Chain Message

**On HashScan:**

1. View your transaction
2. Look for `CrossChainCoverageSent` event
3. Copy the `messageId`
4. Use CCIP Explorer to track: https://ccip.chain.link/

---

## Verification Checklist

Use this checklist to ensure everything is on-chain:

### ✅ Contract Addresses Are Real

- [ ] InsurancePool: `0xA7c59f010700930003b33aB25a7a0679C860f29c`
- [ ] RiskEngine: `0x22753E4264FDDc6181dc7cce468904A80a363E44`
- [ ] ClaimsProcessor: `0xfaAddC93baf78e89DCf37bA67943E1bE8F37Bb8c`
- [ ] HederaBridge: `0x276C216D241856199A83bf27b2286659e5b877D3`

### ✅ Transactions Appear on HashScan

- [ ] Every action creates a real transaction
- [ ] Transaction hashes are displayed with clickable links
- [ ] Links open HashScan with correct transaction
- [ ] Event logs show correct data

### ✅ Data is Read from Blockchain

- [ ] Active policies fetched from `PolicyCreated` events
- [ ] Policy details match on-chain data
- [ ] Claims fetched from `PolicyClaimed` events
- [ ] Pool balance is read from contract

### ✅ Prices are Live from Pyth

- [ ] Prices update every 30 seconds
- [ ] Network tab shows API calls to `/api/prices`
- [ ] Prices match Pyth Network feeds
- [ ] 24-hour changes are calculated from historical data

### ✅ No Mock Data

- [ ] No hardcoded policy data in UI
- [ ] No fake transaction hashes
- [ ] No static prices
- [ ] Claims history comes from events only

---

## Common Issues and Solutions

### Issue: "Insufficient Balance" Error

**Solution:**

- Get more test HBAR from faucet
- Try smaller coverage amount

### Issue: Transaction Fails

**Solution:**

1. Check gas settings in wallet
2. Ensure you have enough HBAR
3. Verify contract addresses are correct
4. Check Hedera testnet status: https://status.hedera.com/

### Issue: No Policies Show Up

**Solution:**

1. Wait 10-15 seconds after purchase
2. Refresh the page
3. Check browser console for errors
4. Verify wallet is connected to correct network

### Issue: Transaction Link Doesn't Work

**Solution:**

1. Make sure transaction is confirmed
2. Copy tx hash manually and search on HashScan
3. Check you're on testnet HashScan, not mainnet

### Issue: Prices Not Updating

**Solution:**

1. Check network connection
2. Open DevTools and look for API errors
3. Pyth Hermes API might be rate-limiting - wait a minute
4. Fallback prices will be used if Pyth is unavailable

---

## Advanced Testing

### Test Pool Balance

1. Check initial pool balance on contract
2. Purchase multiple policies
3. Verify pool balance increases by premium amounts
4. Submit and approve claim
5. Verify pool balance decreases by claim amount

### Test Policy Expiration

1. Create policy with very short duration (7 days)
2. Wait for policy to expire
3. Try submitting claim after expiration
4. Should fail with "Policy Expired" or "Inactive" error

### Test Risk Scoring

1. Purchase coverage with different assets (ETH vs BTC vs HBAR)
2. Note different premium rates
3. Try different durations
4. Longer duration = higher premium
5. Riskier asset (HBAR) = higher premium

### Test Event Filtering

1. Create multiple policies from different accounts
2. Each user should only see their own policies
3. Event filtering by `holder` address

---

## Debugging Tools

### Browser DevTools

```javascript
// Open Console (F12) and run:

// Check contract addresses
console.log("InsurancePool:", "0xA7c59f010700930003b33aB25a7a0679C860f29c");

// Check network
console.log("Network:", window.ethereum.networkVersion);

// Check connected account
window.ethereum
  .request({ method: "eth_accounts" })
  .then((accounts) => console.log("Connected:", accounts[0]));
```

### HashScan API

```bash
# Get contract transactions
curl "https://testnet.hashscan.io/api/v1/contracts/0xA7c59f010700930003b33aB25a7a0679C860f29c/results"

# Get specific transaction
curl "https://testnet.hashscan.io/api/v1/transactions/[tx-hash]"
```

### Hardhat Console (Backend)

```bash
# Connect to contract
npx hardhat console --network hedera-testnet

# In console:
const InsurancePool = await ethers.getContractAt("InsurancePool", "0xA7c59f010700930003b33aB25a7a0679C860f29c");

# Check pool balance
const balance = await InsurancePool.totalPoolBalance();
console.log("Pool Balance:", ethers.formatEther(balance), "HBAR");

# Get policy
const policy = await InsurancePool.getPolicy(1);
console.log(policy);

# Listen to events
InsurancePool.on("PolicyCreated", (policyId, holder, amount, premium) => {
  console.log("New Policy:", policyId.toString());
});
```

---

## Success Criteria

Your testing is successful if:

1. ✅ All transactions appear on HashScan with correct data
2. ✅ UI shows real transaction hashes with working links
3. ✅ Policies are fetched from blockchain events
4. ✅ Policy details match on-chain contract state
5. ✅ Prices update from Pyth Network every 30 seconds
6. ✅ Claims are recorded on-chain with events
7. ✅ No console errors about missing data
8. ✅ Everything works without mock data

---

## Recording Your Test Session

To document your testing:

1. **Record Screen**: Use screen recorder to capture entire flow
2. **Take Screenshots** of:
   - Wallet transaction approval
   - Transaction pending status
   - Transaction success with link
   - HashScan page showing transaction
   - Event logs on HashScan
   - UI showing fetched policy data

3. **Export Data**:
   - Copy transaction hashes
   - Note Policy IDs
   - Record timestamps
   - Save HashScan links

---

## Support Resources

- **Hedera Docs**: https://docs.hedera.com/
- **HashScan**: https://hashscan.io/testnet
- **Pyth Network**: https://pyth.network/
- **Chainlink CCIP**: https://docs.chain.link/ccip

**Need Help?**

- Check browser console for errors
- Verify network connection
- Ensure wallet has test HBAR
- Confirm you're on Hedera testnet (Chain ID: 296)
