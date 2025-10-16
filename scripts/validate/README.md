# OmniShield MVP Validation

Comprehensive validation script to ensure all components of the OmniShield MVP are production-ready.

## Quick Start

```bash
# Run validation with default network (sepolia)
npm run validate-mvp

# Run validation for specific network
NETWORK=hedera npm run validate-mvp:network

# Or directly with hardhat
npx hardhat run scripts/validate/validate-mvp.ts --network ethereum-sepolia
```

## What It Checks

### 1. Smart Contract Validation ✅

- **All contracts deployed and verified**: Checks if InsurancePool, RiskEngine, and ClaimsProcessor are deployed
- **Ownership transferred to multi-sig**: Validates that contracts are owned by the multi-sig wallet
- **Oracle price feeds active**: Verifies Pyth oracle is configured and active
- **Cross-chain bridges connected**: Checks CCIP bridge deployment
- **Emergency pause tested**: Confirms pause functionality works
- **All tests passing**: Validates test coverage is >90%

### 2. Frontend Validation 🎨

- **Wallet connection**: Checks for MetaMask/WalletConnect integration
- **Network switching works**: Validates network switching functionality
- **Transactions execute correctly**: Manual test required
- **Error handling for failed txs**: Verifies error handling implementation
- **Mobile responsive design**: Checks for responsive CSS/breakpoints
- **Loading states implemented**: Validates loading indicators

### 3. Integration Testing 🔗

- **Purchase coverage end-to-end**: Checks E2E test exists
- **Process claim successfully**: Validates claim processing tests
- **LP operations work**: Checks liquidity provider functionality
- **Cross-chain coverage works**: Validates cross-chain test coverage
- **Gas costs within target**: Checks gas report availability

### 4. Security Checklist 🔒

- **Slither analysis clean**: Validates no critical/high issues from Slither
- **No high/critical issues**: Manual review required
- **Access controls verified**: Checks for Ownable/AccessControl usage
- **Reentrancy protection confirmed**: Validates ReentrancyGuard usage
- **Integer overflow protection**: Confirms Solidity 0.8+ usage
- **Oracle manipulation resistant**: Checks oracle security measures

### 5. Documentation 📚

- **README with setup instructions**: Validates README exists and has setup info
- **API documentation**: Checks for API docs
- **Smart contract documentation**: Validates contract documentation
- **User guide created**: Checks for user guide
- **Video demo recorded**: Optional check for demo video

## Output

The script generates:

1. **Console output** with colored status indicators:
   - ✅ PASS - Check passed successfully
   - ❌ FAIL - Critical issue found
   - ⚠️ WARN - Warning or manual verification needed
   - ⏭️ SKIP - Check skipped (not applicable)

2. **JSON report** saved to `validation-report.json`:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "network": "sepolia",
  "results": [
    {
      "category": "Smart Contracts",
      "item": "All contracts deployed",
      "status": "PASS"
    }
  ],
  "summary": {
    "total": 35,
    "passed": 28,
    "failed": 2,
    "warnings": 3,
    "skipped": 2
  }
}
```

3. **Success rate** calculated from passed checks (excluding skipped)

## Exit Codes

- `0` - Validation passed (no failures or <3 warnings)
- `1` - Validation failed (one or more critical failures)

## Prerequisites

Before running validation:

1. **Deploy contracts**:

```bash
npm run deploy:sepolia
# or
npm run deploy:all
```

2. **Run test coverage**:

```bash
npm run coverage
```

3. **Run Slither analysis** (optional):

```bash
slither . --config-file slither.config.json --json slither-report.json
```

4. **Generate gas report** (optional):

```bash
npm run gas-report
```

5. **Set environment variables**:

```bash
# .env file
MULTISIG_ADDRESS=0x...  # For ownership validation
NETWORK=sepolia         # Target network
```

## Example Output

```
╔═══════════════════════════════════════════════════════════╗
║         OmniShield MVP Validation                          ║
╚═══════════════════════════════════════════════════════════╝

Validating network: sepolia

╔═══════════════════════════════════════════════════════════╗
║         1. Smart Contract Validation                       ║
╚═══════════════════════════════════════════════════════════╝

  ✅ All contracts deployed
  ✅ Contracts accessible on-chain
  ⚠️  Ownership transferred to multi-sig: Owner: 0x123...
  ✅ Oracle price feeds active
  ⏭️  Cross-chain bridges connected: Bridge not deployed
  ✅ Emergency pause tested: Currently active
  ✅ All tests passing (>90% coverage): 94.5%

...

╔═══════════════════════════════════════════════════════════╗
║         MVP Validation Report                              ║
╚═══════════════════════════════════════════════════════════╝

Network: sepolia
Timestamp: 2024-01-15T10:30:00.000Z

Summary:
  Total Checks: 35
  ✅ Passed: 28
  ❌ Failed: 0
  ⚠️  Warnings: 5
  ⏭️  Skipped: 2

  Success Rate: 85%

📄 Full report saved to: /path/to/validation-report.json

✅ Validation PASSED
```

## Manual Checks Required

Some checks require manual verification:

1. **Frontend transaction execution**: Test in browser with MetaMask
2. **Mobile responsiveness**: Test on actual mobile devices
3. **Security review**: Have security expert review the code
4. **User guide quality**: Review documentation completeness
5. **Gas costs**: Verify costs are within acceptable ranges

## Continuous Integration

Add to your CI/CD pipeline:

```yaml
# .github/workflows/validate.yml
- name: Run MVP Validation
  run: npm run validate-mvp
  env:
    NETWORK: sepolia
    MULTISIG_ADDRESS: ${{ secrets.MULTISIG_ADDRESS }}
```

## Troubleshooting

### "No deployment file found"

- Ensure contracts are deployed to the specified network
- Check that `deployments/{network}.json` exists

### "Coverage not available"

- Run `npm run coverage` first to generate coverage report

### "Slither analysis clean: SKIP"

- Install Slither: `pip3 install slither-analyzer`
- Run: `slither . --config-file slither.config.json --json slither-report.json`

### "Frontend not found"

- Ensure `frontend/` directory exists
- Frontend validation will be skipped if not present

## Customization

Modify validation rules by editing `scripts/validate/validate-mvp.ts`:

- Add new validation checks
- Adjust pass/fail thresholds
- Customize report format
- Add network-specific validations

## Support

For issues or questions:

- Check the [main README](../../README.md)
- Review [incident response playbook](../../docs/incident-response.md)
- Open an issue on GitHub
