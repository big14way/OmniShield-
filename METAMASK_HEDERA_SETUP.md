# MetaMask Hedera Testnet Setup Guide

## Issue: "Unknown Network" When Connected to Hedera

If you see this in the debug panel:

```
• Current Chain: Unknown (ID: N/A)
• Valid Chain (Hedera 296): ❌
```

It means MetaMask has Hedera added, but it's not configured correctly. Follow this guide to fix it.

---

## ✅ Correct Hedera Testnet Configuration

### Method 1: Add via MetaMask UI (Recommended)

1. **Open MetaMask**
2. **Click network dropdown** (top left, shows current network)
3. **Click "Add Network"** or "Add a network manually"
4. **Fill in these EXACT details:**

```
Network Name: Hedera Testnet
RPC URL: https://testnet.hashio.io/api
Chain ID: 296
Currency Symbol: HBAR
Block Explorer URL: https://hashscan.io/testnet
```

5. **Click "Save"**
6. **Switch to Hedera Testnet**

### Method 2: Chainlist (Easiest)

1. Visit: https://chainlist.org
2. Search for **"Hedera Testnet"**
3. Enable **"Testnets"** toggle (top right)
4. Find **Hedera Testnet (296)**
5. Click **"Add to MetaMask"**
6. Approve in MetaMask popup

---

## 🔍 Verify Configuration

After adding, verify these details in MetaMask:

### Check Network Details

1. Click network dropdown
2. Find "Hedera Testnet"
3. Click ⋮ (three dots) → "Edit"
4. Confirm:
   - Chain ID: **296** (NOT 295 or anything else)
   - RPC URL: **https://testnet.hashio.io/api**

### Test Connection

1. Switch to Hedera Testnet
2. Open OmniShield app
3. Refresh page
4. Check debug panel should now show:

```
• Current Chain: Hedera Testnet (ID: 296)
• Valid Chain (Hedera 296): ✅
```

---

## 🚨 Common Issues & Fixes

### Issue 1: Shows "Unknown (ID: N/A)"

**Cause:** MetaMask doesn't recognize the network
**Fix:**

- Delete existing Hedera network from MetaMask
- Re-add using Method 1 with EXACT details above
- Make sure Chain ID is **296**

### Issue 2: Shows Wrong Chain ID

**Cause:** Added wrong network or Chain ID mismatch
**Fix:**

- Hedera Mainnet is 295 ❌
- Hedera Testnet is 296 ✅
- Delete and re-add with correct Chain ID

### Issue 3: Can't Connect to RPC

**Cause:** Wrong RPC URL
**Fix:**

- Use: `https://testnet.hashio.io/api` (Testnet)
- NOT: `https://mainnet.hashio.io/api` (Mainnet)
- NOT: `https://pool.arkhia.io` (Old/different endpoint)

### Issue 4: Network Added but Still Shows Unknown

**Cause:** Browser cache or wagmi config issue
**Fix:**

1. Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
2. Clear MetaMask cache:
   - Settings → Advanced → Clear activity tab data
3. Disconnect and reconnect wallet
4. Restart browser

---

## 🎯 Step-by-Step Test

Once configured correctly:

1. **Start Frontend:**

   ```bash
   cd frontend
   npm run dev
   ```

2. **Open App:**
   - Go to http://localhost:3000/coverage

3. **Connect MetaMask:**
   - Click "Connect Wallet"
   - Approve connection

4. **Switch to Hedera:**
   - MetaMask → Network dropdown
   - Select "Hedera Testnet"

5. **Verify Debug Panel:**

   ```
   ✅ Current Chain: Hedera Testnet (ID: 296)
   ✅ Valid Chain (Hedera 296): ✅
   ```

6. **Test Premium Calculation:**
   - Enter coverage amount: **10**
   - Wait a few seconds
   - Debug panel should show: `Premium: 0.05 HBAR`

7. **Purchase Button:**
   - Should be **enabled** (blue, not gray)
   - Shows: "Purchase Coverage for 0.05 HBAR"

---

## 💰 Get Test HBAR

After network is configured:

1. **Copy Your Address:**
   - Click MetaMask address to copy

2. **Visit Faucet:**
   - https://portal.hedera.com/faucet

3. **Request Tokens:**
   - Paste your address
   - Click "Receive Testnet HBAR"
   - Get 5 free HBAR

4. **Verify Balance:**
   - Check MetaMask shows HBAR balance
   - Should see ~5 HBAR

---

## 📋 Configuration Checklist

Before testing, ensure:

- [ ] MetaMask has "Hedera Testnet" network
- [ ] Chain ID is **296** (not 295)
- [ ] RPC URL is `https://testnet.hashio.io/api`
- [ ] Currency symbol is **HBAR**
- [ ] Network is selected/active in MetaMask
- [ ] App shows "Hedera Testnet (ID: 296)"
- [ ] Debug panel shows "Valid Chain: ✅"
- [ ] You have test HBAR (≥ 0.1 HBAR for gas)

---

## 🔄 If Still Not Working

### Complete Reset:

1. **Delete Network:**

   ```
   MetaMask → Networks → Hedera Testnet → Delete
   ```

2. **Clear Cache:**

   ```
   Browser → Hard refresh (Ctrl+Shift+R)
   MetaMask → Settings → Advanced → Clear activity data
   ```

3. **Re-add Network:**

   ```
   Use Method 1 or 2 above with EXACT configuration
   ```

4. **Restart Everything:**

   ```bash
   # Stop frontend (Ctrl+C)
   # Restart
   npm run dev
   ```

5. **Reconnect:**
   ```
   Disconnect wallet in app
   Connect again
   Switch to Hedera Testnet
   ```

---

## 🎉 Success Indicators

You'll know it's working when:

✅ MetaMask shows "Hedera Testnet" when connected
✅ App debug panel shows "Hedera Testnet (ID: 296)"
✅ Valid Chain checkbox is ✅
✅ Premium calculates and shows in HBAR
✅ Purchase button is blue and enabled
✅ No red "Wrong Network" warning banner

---

## 🆘 Still Need Help?

If after following all steps, it still shows "Unknown":

1. **Check Browser Console:**
   - F12 → Console tab
   - Look for errors mentioning wagmi, chain, or network
   - Share error messages

2. **Verify RPC Working:**

   ```bash
   curl https://testnet.hashio.io/api \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
   ```

   Should return: `{"jsonrpc":"2.0","id":1,"result":"0x128"}` (0x128 = 296)

3. **Check MetaMask Connection:**
   - App should have access to wallet
   - Try disconnecting and reconnecting
   - Check MetaMask → Connected sites

4. **Environment Variables:**

   ```bash
   # Check .env.local exists
   cat frontend/.env.local

   # Should have:
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
   ```

---

## 📖 Reference

- **Hedera Docs:** https://docs.hedera.com/
- **HashIO RPC:** https://swirldslabs.com/hashio/
- **Network Info:** https://chainlist.org/chain/296
- **Block Explorer:** https://hashscan.io/testnet

---

**After Setup:** Return to `QUICK_TEST_GUIDE.md` to continue testing!
