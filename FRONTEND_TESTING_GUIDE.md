# OmniShield Frontend Testing Guide

## 📋 Complete Testing Checklist for Seamless User Experience

This guide will help you verify that users can flow seamlessly through the OmniShield web application.

---

## 🎯 Quick Start Testing Flow

### Prerequisites Checklist

- [ ] Frontend running on `http://localhost:3000`
- [ ] Hedera testnet wallet installed (HashPack, Blade, or Kabila)
- [ ] Testnet HBAR in wallet (get from https://portal.hedera.com)
- [ ] Browser console open to check for errors

### Start Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🔍 Test Scenarios & Expected Results

### 1. WALLET CONNECTION FLOW

#### Test 1.1: Connect Wallet (Hedera)

**Steps:**

1. Visit http://localhost:3000
2. Click "Connect Wallet" button in header
3. Hover over the button to see wallet options
4. Select your Hedera wallet (HashPack/Blade/Kabila)
5. Approve connection in wallet popup

**Expected Results:**

- ✅ Wallet connection modal appears
- ✅ Available connectors show (Injected, WalletConnect)
- ✅ Wallet popup opens for approval
- ✅ Header shows connected address (0x1234...5678)
- ✅ Header shows current network (Hedera Testnet)
- ✅ Green badge appears with shortened address
- ✅ "Disconnect" button appears

**What to Check:**

- No console errors
- Address displays correctly
- Network name shows "Hedera" not "Chain 296"

---

#### Test 1.2: Network Switching

**Steps:**

1. Click on network name in header (e.g., "Hedera")
2. Hover to see network dropdown
3. Select "Sepolia" or another network

**Expected Results:**

- ✅ Dropdown shows all configured networks (Ethereum, Sepolia, Hedera)
- ✅ Wallet prompts to switch network
- ✅ After approval, header updates to new network name
- ✅ Contract addresses update automatically

**What to Check:**

- Smooth network switching
- No page refresh required
- UI updates immediately

---

#### Test 1.3: Disconnect Wallet

**Steps:**

1. While connected, click "Disconnect" button
2. Observe UI changes

**Expected Results:**

- ✅ Address badge disappears
- ✅ "Connect Wallet" button reappears
- ✅ Network selector disappears
- ✅ Protected pages show "Connect Wallet" message

---

### 2. HOMEPAGE FLOW

#### Test 2.1: Homepage Load

**Steps:**

1. Visit http://localhost:3000
2. Scroll through entire homepage

**Expected Results:**

- ✅ Hero section loads with gradient background
- ✅ "Get Coverage" and "Provide Liquidity" buttons visible
- ✅ Three feature cards display correctly
- ✅ Stats section shows mock data ($12.5M TVL, 342 policies, etc.)
- ✅ Call-to-action section at bottom
- ✅ No layout shifts or broken images
- ✅ Responsive on mobile (test by resizing browser)

**What to Check:**

- All text is readable
- Buttons are clickable
- Colors match design (blue-600, purple-600, pink-600 gradient)
- No console errors

---

#### Test 2.2: Navigation Links

**Steps:**

1. Click "Get Coverage" button (hero section)
2. Verify redirect to /coverage
3. Go back, click "Provide Liquidity"
4. Verify redirect to /liquidity

**Expected Results:**

- ✅ Buttons navigate correctly
- ✅ No 404 errors
- ✅ Page transitions smoothly

---

### 3. COVERAGE PURCHASE FLOW

#### Test 3.1: Access Coverage Page

**Steps:**

1. Navigate to /coverage via menu or hero button
2. Observe page layout

**Expected Results:**

- ✅ "Purchase Coverage" card appears centered
- ✅ Three asset options visible (ETH, BTC, HBAR)
- ✅ Coverage amount input field
- ✅ Duration slider (7-365 days)
- ✅ Three coverage types (Price Protection, Smart Contract, Rug Pull)
- ✅ Premium calculator section
- ✅ Purchase button at bottom

---

#### Test 3.2: Calculate Premium (Not Connected)

**Steps:**

1. WITHOUT connecting wallet
2. Select ETH asset
3. Enter coverage amount: 10
4. Move duration slider to 30 days
5. Select "Price Protection"
6. Observe premium section

**Expected Results:**

- ✅ Premium shows "Calculating..." initially
- ✅ After ~2 seconds, premium displays or shows error
- ✅ USD value appears below amount (~$30,000 for 10 ETH)
- ✅ Premium calculator shows summary (Coverage Amount, Duration, Coverage Type)
- ✅ Premium value in ETH displayed (e.g., 0.05 ETH)
- ✅ USD equivalent of premium shown

**What to Check:**

- Premium calculation completes without errors
- Values update when you change inputs
- Loading states show appropriately

---

#### Test 3.3: Purchase Coverage (Connected)

**Steps:**

1. Connect wallet (see Test 1.1)
2. Ensure on Hedera Testnet
3. Enter coverage: 1 HBAR
4. Set duration: 30 days
5. Select coverage type
6. Wait for premium calculation
7. Click "Purchase Coverage"

**Expected Results:**

- ✅ Button enabled after premium loads
- ✅ Wallet popup opens with transaction details
- ✅ Transaction shows premium amount
- ✅ After approval, button shows "Processing..."
- ✅ Success message appears: "✅ Coverage purchased successfully!"
- ✅ Form resets to default values
- ✅ Transaction confirmed on Hedera

**What to Check:**

- Transaction goes through without errors
- Premium amount matches what wallet shows
- Gas/fees are reasonable
- Success state appears
- Console shows no errors

**Common Issues:**

- If premium is 0, check contract deployment
- If transaction fails, check HBAR balance
- If "Processing..." hangs, check network connectivity

---

#### Test 3.4: Input Validation

**Steps:**

1. Try entering negative coverage amount
2. Try entering 0
3. Try very large number (e.g., 1000000)
4. Move slider to extremes (7 days, 365 days)

**Expected Results:**

- ✅ Negative numbers rejected or converted to positive
- ✅ 0 amount disables purchase button
- ✅ Large numbers accepted but premium adjusts
- ✅ Slider works smoothly at all values
- ✅ Duration displays correctly (e.g., "7 days", "1 year")

---

### 4. LIQUIDITY POOL FLOW

#### Test 4.1: View Pool Stats (Not Connected)

**Steps:**

1. Navigate to /liquidity
2. Observe pool statistics

**Expected Results:**

- ✅ Three stat cards visible (TVL, APY, Utilization)
- ✅ TVL shows real value from contract (or 0 if no liquidity)
- ✅ APY shows 12.5%
- ✅ Utilization shows 65.3%
- ✅ Gradient backgrounds (blue, green, purple)
- ✅ "How Liquidity Provision Works" section visible
- ✅ 4-step process explained

**What to Check:**

- Stats load correctly
- No errors fetching pool balance
- UI is visually appealing

---

#### Test 4.2: View Your Position (Connected)

**Steps:**

1. Connect wallet
2. Navigate to /liquidity
3. Check "Your Position" section

**Expected Results:**

- ✅ "Your Position" card appears (blue border)
- ✅ Shows liquidity provided (mock: $5,000)
- ✅ Shows pool share (mock: 2.3%)
- ✅ Shows estimated annual earnings
- ✅ Shows available to withdraw (80% of position)
- ✅ "Add Liquidity" and "Withdraw" buttons visible

**What to Check:**

- Position section only appears when connected
- Mock data displays correctly
- Calculations are accurate

---

#### Test 4.3: Add Liquidity Modal

**Steps:**

1. Click "Add Liquidity" button
2. Observe modal popup
3. Enter amount: 0.1
4. Check calculations
5. Click "Cancel" to close

**Expected Results:**

- ✅ Modal opens centered on screen
- ✅ "Add Liquidity" title visible
- ✅ Amount input field accepts decimals
- ✅ Expected APY shown (12.5%)
- ✅ Estimated annual earnings calculate correctly (amount × APY)
- ✅ "Cancel" and "Add Liquidity" buttons visible
- ✅ "Add Liquidity" button disabled when amount is 0 or empty
- ✅ Modal closes when clicking "Cancel"
- ✅ Modal closes when clicking outside (if implemented)

**What to Check:**

- Modal overlay darkens background
- Modal is responsive
- Input validation works

---

#### Test 4.4: Add Liquidity Transaction

**Steps:**

1. Open "Add Liquidity" modal
2. Enter amount: 0.1 ETH
3. Click "Add Liquidity"
4. Approve transaction in wallet

**Expected Results:**

- ✅ Wallet opens with transaction
- ✅ Transaction amount matches input
- ✅ After confirmation, modal closes
- ✅ Pool stats update
- ✅ "Your Position" updates with new amount
- ✅ Success notification (if implemented)

**Note:** This may not be fully implemented yet. Check for:

- Transaction function exists
- Correct contract method called
- Error handling

---

### 5. CLAIMS CENTER FLOW

#### Test 5.1: Access Claims (Not Connected)

**Steps:**

1. Navigate to /claims without connecting wallet

**Expected Results:**

- ✅ Lock icon (🔒) appears
- ✅ Message: "Connect Your Wallet"
- ✅ Subtext: "Please connect your wallet to view your coverage and claims"
- ✅ No sensitive data visible

---

#### Test 5.2: View Active Coverage (Connected)

**Steps:**

1. Connect wallet
2. Navigate to /claims
3. View "Active Coverage" section

**Expected Results:**

- ✅ "Active Coverage" heading visible
- ✅ Mock coverage cards appear (2 policies)
- ✅ Each card shows:
  - Asset amount (e.g., "10 ETH")
  - Coverage type (e.g., "Price Protection")
  - Coverage period dates
  - Premium paid
  - Green "Active" badge
  - "Submit Claim" button
- ✅ Cards have hover effect (border changes to blue)

**What to Check:**

- All card data displays correctly
- Dates are readable
- Premium amounts shown

---

#### Test 5.3: Submit Claim Form

**Steps:**

1. Click "Submit Claim" on any coverage card
2. Observe form that appears
3. Note auto-filled Policy ID
4. Enter claim amount: 5
5. Review policy details section

**Expected Results:**

- ✅ "Submit New Claim" form appears with blue border
- ✅ Policy ID auto-filled from selected coverage
- ✅ Claim amount input accepts numbers
- ✅ Policy details section shows:
  - Coverage Amount from contract
  - Policy Status (Active/Inactive)
- ✅ Blue background info box
- ✅ "Submit Claim" button visible

**What to Check:**

- Policy ID matches selected card
- Policy data loads from contract
- Coverage amount displays correctly

---

#### Test 5.4: Submit Claim Transaction

**Steps:**

1. Ensure claim form is filled
2. Click "Submit Claim"
3. Approve transaction

**Expected Results:**

- ✅ Button changes to "Submitting..."
- ✅ Wallet opens with transaction
- ✅ Transaction includes policy ID and claim amount
- ✅ After confirmation, success message appears
- ✅ Form clears/resets
- ✅ Claims history table updates (if real-time)

**What to Check:**

- Transaction succeeds
- Correct contract method called
- Error handling for invalid claims

---

#### Test 5.5: Claims History Table

**Steps:**

1. Scroll to "Claims History" section
2. Review table data

**Expected Results:**

- ✅ Table with headers: Claim ID, Policy ID, Amount, Date, Status
- ✅ Mock claims appear (2 claims)
- ✅ Status badges colored:
  - Pending: Yellow
  - Approved: Green
  - Rejected: Red
  - Paid: Blue
- ✅ Row hover effect (gray background)
- ✅ Data formatted correctly

---

### 6. STATS PAGE FLOW

#### Test 6.1: View Protocol Stats

**Steps:**

1. Navigate to /stats (if exists)
2. Review all statistics

**Expected Results:**

- ✅ Protocol-wide stats display
- ✅ TVL chart/visualization
- ✅ Policy metrics
- ✅ Claims processed
- ✅ Real-time or cached data

**Note:** Check if this page exists in your implementation.

---

## 🐛 Common Issues & Fixes

### Issue: "Contract address not found"

**Cause:** Wallet connected to wrong network or contract not deployed
**Fix:**

1. Verify network is Hedera Testnet (Chain ID: 296)
2. Check `frontend/src/lib/web3/contracts.ts` has correct addresses
3. Ensure contracts deployed to Hedera

---

### Issue: Premium shows "---" or doesn't calculate

**Cause:** Contract read failing or network issue
**Fix:**

1. Check browser console for errors
2. Verify RPC endpoint: https://testnet.hashio.io/api
3. Test contract manually:
   ```bash
   npx hardhat console --network hedera-testnet
   const pool = await ethers.getContractAt("InsurancePool", "0xA7c59f010700930003b33aB25a7a0679C860f29c")
   await pool.calculatePremium(ethers.parseEther("1"), 30*24*60*60)
   ```

---

### Issue: Transaction fails with "Insufficient funds"

**Cause:** Not enough HBAR for premium + gas
**Fix:**

1. Check wallet balance
2. Get testnet HBAR: https://portal.hedera.com
3. Try smaller coverage amount

---

### Issue: WalletConnect modal doesn't appear

**Cause:** WalletConnect project ID missing or invalid
**Fix:**

1. Check `frontend/.env`: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=1eebe528ca0ce94a99ceaa2e915058d7`
2. Verify in `frontend/src/lib/web3/config.ts`
3. Restart dev server

---

### Issue: Page shows 404

**Cause:** Next.js routing issue
**Fix:**

1. Ensure page exists in `frontend/src/app/[page]/page.tsx`
2. Clear `.next` cache: `rm -rf .next && npm run dev`

---

### Issue: Styles not loading

**Cause:** Tailwind CSS issue
**Fix:**

1. Check `frontend/tailwind.config.ts` is correct
2. Ensure `globals.css` imports Tailwind
3. Restart dev server

---

## ✅ Complete Testing Checklist

Use this checklist to verify all functionality:

### Wallet & Connection

- [ ] Can connect wallet (Hedera)
- [ ] Can switch networks
- [ ] Can disconnect wallet
- [ ] Address displays correctly
- [ ] Network name shows correctly

### Homepage

- [ ] Hero section loads
- [ ] Feature cards display
- [ ] Stats section visible
- [ ] All links work
- [ ] Responsive on mobile

### Coverage Page

- [ ] Asset selector works
- [ ] Amount input accepts numbers
- [ ] Duration slider functional
- [ ] Coverage type selector works
- [ ] Premium calculates correctly
- [ ] Premium shows USD equivalent
- [ ] Purchase button works (when connected)
- [ ] Transaction succeeds
- [ ] Success message appears
- [ ] Form resets after purchase

### Liquidity Page

- [ ] Pool stats load
- [ ] TVL shows real data
- [ ] APY displays
- [ ] "Your Position" appears when connected
- [ ] "Add Liquidity" modal opens
- [ ] Modal calculates earnings
- [ ] Modal validates input
- [ ] Transaction works (if implemented)

### Claims Page

- [ ] Shows lock screen when not connected
- [ ] Active coverage cards display
- [ ] "Submit Claim" button works
- [ ] Claim form auto-fills policy ID
- [ ] Policy details load from contract
- [ ] Claim submission works
- [ ] Claims history table displays
- [ ] Status badges colored correctly

### General UX

- [ ] No console errors
- [ ] Loading states show appropriately
- [ ] Error messages are clear
- [ ] Buttons disabled when appropriate
- [ ] Hover effects work
- [ ] Responsive design works
- [ ] Fast page loads
- [ ] Smooth transitions

---

## 🚀 Performance Testing

### Speed Metrics

Check these in Chrome DevTools (Lighthouse):

- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1

### Network Testing

Test with throttled network (Chrome DevTools):

- [ ] App usable on "Fast 3G"
- [ ] Loading states show appropriately
- [ ] No crashes on slow connection

---

## 📱 Mobile Responsiveness

Test on mobile viewport (375px width):

- [ ] Header collapses/adjusts
- [ ] Cards stack vertically
- [ ] Buttons are tapable (min 44px)
- [ ] Text is readable
- [ ] No horizontal scroll
- [ ] Modals fit screen
- [ ] Forms are usable

---

## 🔒 Security Checks

- [ ] Private keys never logged
- [ ] Sensitive data not in frontend code
- [ ] Transaction amounts match expected
- [ ] No XSS vulnerabilities in inputs
- [ ] HTTPS in production
- [ ] WalletConnect uses secure connection

---

## 📊 Expected User Journey

### New User (First Time)

1. Lands on homepage → Sees value proposition
2. Clicks "Get Coverage" → Redirects to /coverage
3. Sees "Connect Wallet" message → Clicks to connect
4. Connects Hedera wallet → Sees form
5. Enters coverage details → Premium calculates
6. Reviews premium → Clicks "Purchase"
7. Approves transaction → Sees success message
8. Navigates to "Claims" → Sees active coverage

### Liquidity Provider

1. Lands on homepage → Clicks "Provide Liquidity"
2. Connects wallet → Sees pool stats
3. Clicks "Add Liquidity" → Modal opens
4. Enters amount → Sees estimated earnings
5. Confirms → Transaction processes
6. Sees updated position → Earns from premiums

### Existing User (Claim)

1. Connects wallet → Goes to Claims
2. Sees active coverage → Clicks "Submit Claim"
3. Fills claim form → Reviews policy details
4. Submits claim → Transaction confirms
5. Sees claim in history → Waits for approval

---

## 🎯 Success Criteria

Your frontend is working perfectly if:

✅ **No console errors** throughout entire flow
✅ **All transactions succeed** on Hedera testnet
✅ **UI is responsive** and looks good on all screens
✅ **Data loads correctly** from smart contracts
✅ **Forms validate** input properly
✅ **Loading states** appear and resolve
✅ **Success/error messages** show appropriately
✅ **Navigation works** smoothly between pages
✅ **Wallet connection** is seamless
✅ **User can complete** full purchase → claim flow without confusion

---

## 📞 Getting Help

If tests fail:

1. Check browser console for specific errors
2. Verify contract addresses in `contracts.ts`
3. Confirm wallet has testnet HBAR
4. Test contracts directly with Hardhat console
5. Check network is Hedera Testnet (296)
6. Review `HEDERA_DEPLOYMENT.md` for contract details

---

**Happy Testing! 🎉**

Once all checkboxes are checked, your OmniShield app is ready for users.
