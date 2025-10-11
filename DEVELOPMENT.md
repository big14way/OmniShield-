# Development Guidelines

## Setup

After cloning the repository, install dependencies:

```bash
npm install
```

Husky git hooks will be automatically initialized.

## Code Quality Tools

### Formatting

The project uses **Prettier** for code formatting with the Solidity plugin.

- **Check formatting**: `npm run format:check`
- **Auto-format all files**: `npm run format`

Configuration: `.prettierrc`

### Linting

#### Solidity Linting

Uses **Solhint** with security-focused rules.

- **Lint Solidity**: `npm run lint:sol`
- **Config**: `.solhint.json`

Common warnings:

- Missing NatSpec documentation (use `@title`, `@notice`, `@param`, `@return`)
- Gas optimization suggestions
- Security best practices

#### TypeScript Linting

Uses **ESLint v9** with TypeScript support.

- **Lint TypeScript**: `npm run lint:ts`
- **Fix auto-fixable issues**: `npm run lint:fix`
- **Config**: `eslint.config.mjs`

### Pre-commit Hooks

**Husky** runs automatic checks before each commit:

1. **Prettier** - Auto-formats staged files
2. **Solhint** - Lints Solidity contracts
3. **ESLint** - Lints TypeScript files
4. **Console.log detection** - Blocks commits with `console.log` in Solidity files

To bypass hooks (use sparingly):

```bash
git commit --no-verify -m "your message"
```

## Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run coverage

# Generate gas report
npm run gas-report
```

## Static Analysis

### Slither

For security analysis, install Slither:

```bash
pip3 install slither-analyzer
pip3 install solc-select
solc-select install 0.8.24
solc-select use 0.8.24
```

Run Slither:

```bash
slither . --config-file slither.config.json
```

Configuration: `slither.config.json`

- Focuses on high and medium severity issues
- Excludes optimization and informational findings
- Filters test and mock contracts

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/test.yml`) runs on:

- Push to `main` branch
- All pull requests

### Workflow Jobs

#### 1. Lint and Test

- Prettier formatting check
- ESLint for TypeScript
- Solhint for Solidity
- Contract compilation
- Contract size check
- Full test suite with coverage
- Gas report generation
- Coverage upload to Codecov

#### 2. Security Analysis

- Slither static analysis
- Report uploaded as artifact

#### 3. Build Check

- Clean build verification
- TypeScript compilation check

## Available Scripts

| Script                   | Description                |
| ------------------------ | -------------------------- |
| `npm run compile`        | Compile Solidity contracts |
| `npm test`               | Run all tests              |
| `npm run coverage`       | Generate coverage report   |
| `npm run size`           | Check contract sizes       |
| `npm run gas-report`     | Generate gas usage report  |
| `npm run lint`           | Run all linters            |
| `npm run lint:sol`       | Lint Solidity files        |
| `npm run lint:ts`        | Lint TypeScript files      |
| `npm run lint:fix`       | Auto-fix linting issues    |
| `npm run format`         | Format all files           |
| `npm run format:check`   | Check formatting           |
| `npm run clean`          | Clean build artifacts      |
| `npm run deploy:local`   | Deploy to local network    |
| `npm run deploy:sepolia` | Deploy to Sepolia          |
| `npm run deploy:hedera`  | Deploy to Hedera testnet   |
| `npm run deploy:polygon` | Deploy to Polygon Amoy     |

## Best Practices

### Before Committing

1. Run linters: `npm run lint`
2. Run tests: `npm test`
3. Check formatting: `npm run format:check`
4. Review your changes: `git diff`

### Writing Contracts

1. **Documentation**: Add NatSpec comments (`@title`, `@notice`, `@param`, `@return`)
2. **Security**: Follow Checks-Effects-Interactions pattern
3. **Gas Optimization**: Use custom errors instead of require strings
4. **Testing**: Write tests for all new functionality

### Code Review Checklist

- [ ] All tests pass
- [ ] Coverage maintained or improved
- [ ] Gas usage is reasonable
- [ ] No console.log in production code
- [ ] NatSpec documentation complete
- [ ] Security considerations addressed
- [ ] Slither findings reviewed and addressed

## Troubleshooting

### Pre-commit Hook Fails

If pre-commit hooks fail:

1. Review the error messages
2. Fix the issues manually
3. Re-stage files: `git add .`
4. Try committing again

### ESLint Configuration

The project uses ESLint v9 with the new flat config format (`eslint.config.mjs`).
Old `.eslintrc.*` files are deprecated.

### Coverage Report Not Generated

Make sure you have all dependencies installed:

```bash
npm ci
```

### Slither Not Found

Install Slither and configure solc version:

```bash
pip3 install slither-analyzer solc-select
solc-select install 0.8.24
solc-select use 0.8.24
```

## Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Solhint Rules](https://github.com/protofire/solhint/blob/master/docs/rules.md)
- [ESLint Documentation](https://eslint.org/docs/latest/)
- [Prettier Documentation](https://prettier.io/docs/en/)
- [Slither Documentation](https://github.com/crytic/slither)
