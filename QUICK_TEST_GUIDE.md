# Quick Test Guide - 5 Minute On-Chain Verification

## 🚀 Quick Setup (2 minutes)

```bash
# 1. Start frontend
cd frontend
npm run dev

# 2. Open browser
# http://localhost:3000
```

**Get Test HBAR:**
- Faucet: https://portal.hedera.com/faucet
- Request 5 HBAR to your wallet address

---

## 🧪 3-Step On-Chain Test

### STEP 1: Purchase Coverage (1 min)

1. Connect wallet → Hedera Testnet (Chain ID: 296)
2. Go to `/coverage`
3. Enter:
   - Asset: **ETH**
   - Amount: **10**
   - Duration: **30 days**
4. Click **Purchase Coverage**
5. Approve in wallet

**✅ Verify:**
- Transaction link appears → Click it
- Opens HashScan → See transaction details
- Look for `PolicyCreated` event
- Copy **Policy ID** from event

**HashScan Link:**
```
https://hashscan.io/testnet/contract/0xA7c59f010700930003b33aB25a7a0679C860f29c
```

---

### STEP 2: View Your Policy (30 sec)

1. Go to `/claims`
2. Wait 10 seconds for loading
3. See your policy card with:
   - ✅ Coverage Amount: 10 ETH
   - ✅ Premium Paid
   - ✅ Start/End dates
   - ✅ Active status

**✅ Verify On-Chain:**
1. Open HashScan contract (link above)
2. Go to "Read Contract" tab
3. Call `getPolicy(YOUR_POLICY_ID)`
4. Compare data with UI → Should match!

---

### STEP 3: Submit Claim (1 min)

1. Click **Submit Claim** on your policy
2. Enter claim amount: **5**
3. Click **Submit Claim**
4. Approve transaction

**✅ Verify:**
- Transaction link appears
- Click link → HashScan opens
- See `PolicyClaimed` event with your amount
- Claim appears in "Claims History" table

---

## 🔍 Quick Verification Checklist

### Transaction Links Work
```
- [ ] Every action shows transaction hash
- [ ] Links open HashScan
- [ ] Transactions show "Success" status
```

### Data is On-Chain
```
- [ ] Policies fetched from blockchain events
- [ ] Policy details match contract state
- [ ] No hardcoded/fake data in UI
```

### Prices are Live
```
- [ ] Prices show on homepage
- [ ] Open DevTools → Network tab
- [ ] See calls to /api/prices
- [ ] Prices update every 30 seconds
```

---

## 📍 Important Addresses

**InsurancePool (Main Contract):**
```
0xA7c59f010700930003b33aB25a7a0679C860f29c
```

**RiskEngine:**
```
0x22753E4264FDDc6181dc7cce468904A80a363E44
```

**HashScan Explorer:**
```
https://hashscan.io/testnet
```

---

## 🐛 Quick Troubleshooting

**No policies showing?**
```bash
# Wait 15 seconds, then refresh page
# Check: Are you on Hedera Testnet (296)?
```

**Transaction fails?**
```bash
# Get more test HBAR from faucet
# Try smaller coverage amount (e.g., 1 ETH)
```

**Prices not loading?**
```bash
# Check browser console (F12)
# Network tab → Look for API errors
# Refresh page
```

---

## 📹 Record Your Test

1. Open screen recorder
2. Show wallet connection
3. Purchase coverage
4. Click transaction link → Show HashScan
5. Show policy in UI
6. Show contract data on HashScan
7. Submit claim
8. Show claim transaction on HashScan

**This proves everything is on-chain!**

---

## 🎯 Expected Results

After 5 minutes of testing, you should have:

✅ **2-3 transactions** on HashScan under your address
✅ **1 active policy** visible in UI and on-chain
✅ **1 submitted claim** with transaction hash
✅ **Transaction links** that open HashScan for every action
✅ **Event logs** on HashScan showing PolicyCreated and PolicyClaimed

**If you see all of this → Everything is on-chain! 🎉**

---

## 💡 Pro Tips

1. **Keep HashScan open** in another tab while testing
2. **Copy all transaction hashes** to a text file for reference
3. **Compare timestamps** between UI and HashScan
4. **Check event logs** on every transaction
5. **Test with small amounts** first (1-2 ETH coverage)

---

## 📊 What You're Testing

| Feature | On-Chain Proof |
|---------|----------------|
| Purchase Coverage | `PolicyCreated` event on HashScan |
| View Policies | Fetched from blockchain events |
| Submit Claim | `PolicyClaimed` event on HashScan |
| Pool Balance | `totalPoolBalance()` contract call |
| Pyth Prices | API calls to Pyth Hermes |
| Transaction Status | Real tx hashes with HashScan links |

---

## 🚨 Red Flags (Signs of Mock Data)

❌ **No transaction links** → Mock data
❌ **Links don't open HashScan** → Fake hashes
❌ **Policies show instantly** → Not fetching from chain
❌ **Same data for everyone** → Hardcoded mocks
❌ **Prices never change** → Static mock prices

**You should see NONE of these!**

---

## ✅ Green Flags (Real On-Chain)

✅ **Transaction links everywhere** → Real blockchain
✅ **Loading indicators** → Fetching from chain
✅ **Data matches HashScan** → On-chain verification
✅ **Unique data per wallet** → Event filtering working
✅ **Prices update regularly** → Live Pyth feeds

**You should see ALL of these!**

---

## 📞 Need Full Details?

See `TESTING_ONCHAIN_FLOW.md` for:
- Complete step-by-step guide
- Advanced testing scenarios
- Debugging tools
- CCIP cross-chain testing
- API verification

---

**Happy Testing! 🧪**
