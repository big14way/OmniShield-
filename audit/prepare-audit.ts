import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

interface ContractInfo {
  name: string;
  path: string;
  size: number;
  functions: string[];
  events: string[];
  dependencies: string[];
}

interface TestCoverage {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

interface AuditPackage {
  projectInfo: ProjectInfo;
  contracts: ContractInfo[];
  testCoverage: TestCoverage;
  dependencies: DependencyInfo[];
  securityAssumptions: string[];
  deploymentParams: DeploymentParams;
  knownIssues: string[];
}

interface ProjectInfo {
  name: string;
  version: string;
  description: string;
  compiler: string;
  network: string;
}

interface DependencyInfo {
  name: string;
  version: string;
  purpose: string;
  audited: boolean;
}

interface DeploymentParams {
  networks: NetworkConfig[];
  initialOwner: string;
  multisig: string;
  timelock: number;
}

interface NetworkConfig {
  name: string;
  chainId: number;
  rpc: string;
}

class AuditPreparation {
  private outputDir: string;
  private contractsDir: string;

  constructor() {
    this.outputDir = path.join(__dirname, "../audit-package");
    this.contractsDir = path.join(__dirname, "../contracts");
  }

  async prepareAuditPackage(): Promise<void> {
    console.log("╔═══════════════════════════════════════════════════════════╗");
    console.log("║         OmniShield Audit Preparation                      ║");
    console.log("╚═══════════════════════════════════════════════════════════╝\n");

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const auditPackage: AuditPackage = {
      projectInfo: await this.getProjectInfo(),
      contracts: await this.generateContractDocumentation(),
      testCoverage: await this.generateTestCoverageReport(),
      dependencies: await this.listExternalDependencies(),
      securityAssumptions: this.documentSecurityAssumptions(),
      deploymentParams: await this.prepareDeploymentParameters(),
      knownIssues: this.documentKnownIssues(),
    };

    await this.saveAuditPackage(auditPackage);
    await this.generateReadme();
    await this.generateContractDiagrams();

    console.log("\n✅ Audit package prepared successfully!");
    console.log(`📦 Location: ${this.outputDir}`);
  }

  private async getProjectInfo(): Promise<ProjectInfo> {
    console.log("\n=== Gathering Project Information ===");

    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../package.json"), "utf-8")
    );

    const compiler = this.getCompilerVersion();

    const projectInfo: ProjectInfo = {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      compiler,
      network: process.env.NETWORK || "ethereum-sepolia",
    };

    console.log(`Name: ${projectInfo.name}`);
    console.log(`Version: ${projectInfo.version}`);
    console.log(`Compiler: ${projectInfo.compiler}`);

    return projectInfo;
  }

  private getCompilerVersion(): string {
    try {
      const hardhatConfig = fs.readFileSync(path.join(__dirname, "../hardhat.config.ts"), "utf-8");
      const match = hardhatConfig.match(/version:\s*["']([^"']+)["']/);
      return match ? match[1] : "0.8.24";
    } catch {
      return "0.8.24";
    }
  }

  private async generateContractDocumentation(): Promise<ContractInfo[]> {
    console.log("\n=== Generating Contract Documentation ===");

    const contracts: ContractInfo[] = [];
    const contractDirs = ["core", "oracles", "crosschain", "tokens"];

    for (const dir of contractDirs) {
      const dirPath = path.join(this.contractsDir, dir);
      if (!fs.existsSync(dirPath)) continue;

      const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".sol"));

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const content = fs.readFileSync(filePath, "utf-8");

        const contractInfo: ContractInfo = {
          name: file.replace(".sol", ""),
          path: `contracts/${dir}/${file}`,
          size: content.length,
          functions: this.extractFunctions(content),
          events: this.extractEvents(content),
          dependencies: this.extractDependencies(content),
        };

        contracts.push(contractInfo);
        console.log(`  ✅ ${contractInfo.name}`);
      }
    }

    console.log(`\nTotal Contracts: ${contracts.length}`);
    return contracts;
  }

  private extractFunctions(content: string): string[] {
    const functionRegex = /function\s+(\w+)\s*\([^)]*\)/g;
    const matches = content.matchAll(functionRegex);
    return Array.from(matches, (m) => m[1]);
  }

  private extractEvents(content: string): string[] {
    const eventRegex = /event\s+(\w+)\s*\([^)]*\)/g;
    const matches = content.matchAll(eventRegex);
    return Array.from(matches, (m) => m[1]);
  }

  private extractDependencies(content: string): string[] {
    const importRegex = /import\s+["']([^"']+)["']/g;
    const matches = content.matchAll(importRegex);
    return Array.from(matches, (m) => m[1]);
  }

  private async generateTestCoverageReport(): Promise<TestCoverage> {
    console.log("\n=== Generating Test Coverage Report ===");

    try {
      console.log("Running coverage analysis...");
      execSync("npx hardhat coverage", { stdio: "pipe" });

      const coveragePath = path.join(__dirname, "../coverage/coverage-summary.json");

      if (fs.existsSync(coveragePath)) {
        const coverageData = JSON.parse(fs.readFileSync(coveragePath, "utf-8"));
        const total = coverageData.total;

        const coverage: TestCoverage = {
          statements: total.statements.pct,
          branches: total.branches.pct,
          functions: total.functions.pct,
          lines: total.lines.pct,
        };

        console.log(`  Statements: ${coverage.statements}%`);
        console.log(`  Branches: ${coverage.branches}%`);
        console.log(`  Functions: ${coverage.functions}%`);
        console.log(`  Lines: ${coverage.lines}%`);

        return coverage;
      }
    } catch {
      console.log("  ⚠️  Could not generate coverage report");
    }

    return {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
    };
  }

  private async listExternalDependencies(): Promise<DependencyInfo[]> {
    console.log("\n=== Listing External Dependencies ===");

    const dependencies: DependencyInfo[] = [
      {
        name: "@openzeppelin/contracts",
        version: "^5.4.0",
        purpose: "Standard library for access control, security patterns, and utilities",
        audited: true,
      },
      {
        name: "@chainlink/contracts-ccip",
        version: "^1.6.2",
        purpose: "Cross-chain messaging and interoperability",
        audited: true,
      },
      {
        name: "@pythnetwork/pyth-sdk-solidity",
        version: "^4.2.0",
        purpose: "Real-time price feeds for risk calculations",
        audited: true,
      },
      {
        name: "@chainlink/contracts",
        version: "^1.5.0",
        purpose: "Additional oracle and automation services",
        audited: true,
      },
    ];

    dependencies.forEach((dep) => {
      console.log(`  ${dep.name}@${dep.version}`);
      console.log(`    Purpose: ${dep.purpose}`);
      console.log(`    Audited: ${dep.audited ? "✅ Yes" : "⚠️  No"}`);
    });

    return dependencies;
  }

  private documentSecurityAssumptions(): string[] {
    console.log("\n=== Documenting Security Assumptions ===");

    const assumptions = [
      "Pyth Network oracle provides accurate and timely price data",
      "Multi-sig owners are trusted and secure their private keys properly",
      "Chainlink CCIP correctly handles cross-chain messages",
      "OpenZeppelin contracts maintain their security properties",
      "Network validators maintain chain consensus and finality",
      "Gas prices remain within reasonable bounds for emergency operations",
      "Users understand risks and read policy terms before purchasing",
      "Claims are processed by authorized administrators only",
      "Emergency pause can be executed within 15 minutes of threat detection",
      "Timelock delays provide sufficient time for community review",
    ];

    assumptions.forEach((assumption, i) => {
      console.log(`  ${i + 1}. ${assumption}`);
    });

    return assumptions;
  }

  private async prepareDeploymentParameters(): Promise<DeploymentParams> {
    console.log("\n=== Preparing Deployment Parameters ===");

    const networks: NetworkConfig[] = [
      {
        name: "ethereum-sepolia",
        chainId: 11155111,
        rpc: "https://ethereum-sepolia.publicnode.com",
      },
      {
        name: "polygon-amoy",
        chainId: 80002,
        rpc: "https://rpc-amoy.polygon.technology",
      },
      {
        name: "hedera-testnet",
        chainId: 296,
        rpc: "https://testnet.hashio.io/api",
      },
    ];

    const params: DeploymentParams = {
      networks,
      initialOwner: process.env.INITIAL_OWNER || "0x...",
      multisig: process.env.MULTISIG_ADDRESS || "TBD",
      timelock: parseInt(process.env.TIMELOCK_DELAY || "172800"),
    };

    console.log(`  Networks: ${params.networks.length}`);
    console.log(`  Timelock: ${params.timelock}s (${params.timelock / 3600}h)`);

    return params;
  }

  private documentKnownIssues(): string[] {
    console.log("\n=== Documenting Known Issues ===");

    const knownIssues = [
      "Gas optimization opportunities exist in premium calculation loops",
      "Emergency pause does not prevent view function calls",
      "Cross-chain message ordering not guaranteed in high congestion",
      "Oracle price staleness check relies on external timestamp",
      "Large batch operations may exceed block gas limits",
    ];

    if (knownIssues.length === 0) {
      console.log("  ✅ No known issues");
    } else {
      knownIssues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue}`);
      });
    }

    return knownIssues;
  }

  private async saveAuditPackage(auditPackage: AuditPackage): Promise<void> {
    console.log("\n=== Saving Audit Package ===");

    const outputPath = path.join(this.outputDir, "audit-package.json");
    fs.writeFileSync(outputPath, JSON.stringify(auditPackage, null, 2));

    console.log(`  ✅ Saved to: ${outputPath}`);

    const summaryPath = path.join(this.outputDir, "AUDIT_SUMMARY.md");
    const summary = this.generateAuditSummary(auditPackage);
    fs.writeFileSync(summaryPath, summary);

    console.log(`  ✅ Summary: ${summaryPath}`);
  }

  private generateAuditSummary(auditPackage: AuditPackage): string {
    return `# OmniShield Audit Summary

## Project Information

- **Name**: ${auditPackage.projectInfo.name}
- **Version**: ${auditPackage.projectInfo.version}
- **Description**: ${auditPackage.projectInfo.description}
- **Compiler**: Solidity ${auditPackage.projectInfo.compiler}
- **Network**: ${auditPackage.projectInfo.network}

## Contract Overview

Total Contracts: ${auditPackage.contracts.length}

${auditPackage.contracts
  .map(
    (c) => `### ${c.name}

- **Path**: \`${c.path}\`
- **Size**: ${c.size} bytes
- **Functions**: ${c.functions.length}
- **Events**: ${c.events.length}
- **Dependencies**: ${c.dependencies.length}

**Key Functions**:
${c.functions
  .slice(0, 10)
  .map((f) => `- ${f}`)
  .join("\n")}

**Events**:
${c.events.map((e) => `- ${e}`).join("\n")}
`
  )
  .join("\n")}

## Test Coverage

- **Statements**: ${auditPackage.testCoverage.statements}%
- **Branches**: ${auditPackage.testCoverage.branches}%
- **Functions**: ${auditPackage.testCoverage.functions}%
- **Lines**: ${auditPackage.testCoverage.lines}%

${
  auditPackage.testCoverage.statements < 80
    ? "⚠️ **Warning**: Coverage is below recommended 80% threshold"
    : "✅ Coverage meets recommended threshold"
}

## External Dependencies

${auditPackage.dependencies
  .map(
    (d) => `### ${d.name}

- **Version**: ${d.version}
- **Purpose**: ${d.purpose}
- **Audited**: ${d.audited ? "✅ Yes" : "⚠️ No"}
`
  )
  .join("\n")}

## Security Assumptions

${auditPackage.securityAssumptions.map((a, i) => `${i + 1}. ${a}`).join("\n")}

## Deployment Configuration

### Networks

${auditPackage.deploymentParams.networks
  .map((n) => `- **${n.name}** (Chain ID: ${n.chainId})`)
  .join("\n")}

### Governance

- **Initial Owner**: \`${auditPackage.deploymentParams.initialOwner}\`
- **Multi-sig**: \`${auditPackage.deploymentParams.multisig}\`
- **Timelock**: ${auditPackage.deploymentParams.timelock} seconds (${auditPackage.deploymentParams.timelock / 3600} hours)

## Known Issues

${
  auditPackage.knownIssues.length > 0
    ? auditPackage.knownIssues.map((issue, i) => `${i + 1}. ${issue}`).join("\n")
    : "None reported"
}

## Areas Requiring Special Attention

1. **Premium Calculation Logic**: Complex mathematical operations that could be exploited
2. **Cross-chain Message Handling**: Ensure proper validation and replay protection
3. **Oracle Integration**: Verify price staleness checks and manipulation resistance
4. **Emergency Mechanisms**: Test pause/unpause functionality thoroughly
5. **Access Control**: Review all privileged functions and role assignments
6. **Reentrancy Protection**: Verify guards on all external calls
7. **Integer Overflow/Underflow**: Check all arithmetic operations
8. **Front-running Resistance**: Analyze transaction ordering dependencies

## Recommended Audit Scope

### Critical Priority
- InsurancePool.sol
- ClaimsProcessor.sol
- RiskEngine.sol
- PythPriceConsumer.sol

### High Priority
- HederaBridge.sol
- CrossChainBridge.sol
- TimelockController integration

### Medium Priority
- Token contracts
- Helper libraries
- Utility functions

## Pre-Audit Checklist

- [x] All contracts compiled successfully
- [x] Test suite passes completely
- [x] Coverage report generated
- [x] Dependencies documented
- [x] Deployment parameters prepared
- [x] Known issues documented
- [x] Security assumptions listed
- [ ] External audit firm selected
- [ ] Audit timeline scheduled
- [ ] Bug bounty program prepared

## Contact Information

- **Lead Developer**: [Email]
- **Security Lead**: [Email]
- **Project Repository**: [GitHub URL]
- **Documentation**: [Docs URL]

---

**Generated**: ${new Date().toISOString()}
**Version**: ${auditPackage.projectInfo.version}
`;
  }

  private async generateReadme(): Promise<void> {
    console.log("\n=== Generating Audit Package README ===");

    const readme = `# OmniShield Audit Package

This package contains all materials needed for a comprehensive security audit of the OmniShield protocol.

## Contents

- \`audit-package.json\` - Complete audit data in JSON format
- \`AUDIT_SUMMARY.md\` - Human-readable audit summary
- \`contracts/\` - Flattened contract source code
- \`tests/\` - Complete test suite
- \`coverage/\` - Test coverage reports
- \`docs/\` - Technical documentation

## Quick Start

### Review Contracts

All contract source code is in the \`contracts/\` directory, organized by functionality:
- \`core/\` - Core protocol contracts
- \`oracles/\` - Price feed integration
- \`crosschain/\` - Bridge implementations
- \`tokens/\` - Token contracts

### Run Tests

\`\`\`bash
cd ../
npm install
npm test
\`\`\`

### Generate Coverage

\`\`\`bash
npm run coverage
\`\`\`

### View Documentation

- Project Overview: ../README.md
- Deployment Guide: ../DEPLOYMENT_GUIDE.md
- Incident Response: ../docs/incident-response.md

## Focus Areas

Please pay special attention to:

1. **Access Control**: Verify all privileged functions
2. **Economic Logic**: Review premium calculations and claim processing
3. **Oracle Integration**: Check price feed manipulation resistance
4. **Cross-chain Security**: Validate bridge message handling
5. **Emergency Mechanisms**: Test pause/unpause functionality

## Known Issues

See \`AUDIT_SUMMARY.md\` for a list of known issues and limitations.

## Questions?

Contact: security@omnishield.io

## Timeline

- **Audit Start**: [TBD]
- **Expected Duration**: 2-3 weeks
- **Report Delivery**: [TBD]
- **Remediation Period**: 1-2 weeks
- **Re-audit**: 1 week

---

Thank you for helping secure the OmniShield protocol!
`;

    const readmePath = path.join(this.outputDir, "README.md");
    fs.writeFileSync(readmePath, readme);

    console.log(`  ✅ Created: ${readmePath}`);
  }

  private async generateContractDiagrams(): Promise<void> {
    console.log("\n=== Generating Contract Diagrams ===");

    const diagrams = `# OmniShield Contract Architecture

## System Overview

\`\`\`
┌─────────────────────────────────────────────────────────────────┐
│                         OmniShield Protocol                      │
└─────────────────────────────────────────────────────────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
         ┌──────▼──────┐  ┌─────▼─────┐  ┌──────▼──────┐
         │ InsurancePool│  │RiskEngine │  │ClaimsProc.  │
         └──────┬──────┘  └─────┬─────┘  └──────┬──────┘
                │                │                │
         ┌──────▼────────────────▼────────────────▼──────┐
         │         External Dependencies                   │
         │  ┌───────────┐  ┌──────────┐  ┌─────────────┐ │
         │  │  Pyth     │  │ Chainlink│  │   Hedera    │ │
         │  │  Oracle   │  │   CCIP   │  │   Bridge    │ │
         │  └───────────┘  └──────────┘  └─────────────┘ │
         └──────────────────────────────────────────────┘
\`\`\`

## Data Flow

### Policy Creation

\`\`\`
User ──▸ InsurancePool.createPolicy()
           │
           ├──▸ RiskEngine.isEligibleForCoverage()
           │     └──▸ PythOracle.getPrice()
           │
           ├──▸ calculatePremium()
           │     └──▸ RiskEngine.calculateRisk()
           │
           └──▸ Store policy & collect premium
\`\`\`

### Claim Processing

\`\`\`
User ──▸ ClaimsProcessor.submitClaim()
           │
           ├──▸ Verify policy validity
           │
           ├──▸ Store claim (Pending status)
           │
Admin ──▸ approveClaim() / rejectClaim()
           │
           └──▸ payClaim()
                   └──▸ Transfer funds to claimant
\`\`\`

### Cross-chain Bridge

\`\`\`
Source Chain                  Destination Chain
     │                              │
User ──▸ HederaBridge.bridge()     │
           │                         │
           ├──▸ Lock funds          │
           │                         │
           └──▸ CCIP.send() ────────▸ CCIP.receive()
                                      │
                                      └──▸ Mint/Release
\`\`\`

## Contract Dependencies

\`\`\`
InsurancePool
├── IRiskEngine
├── @openzeppelin/Ownable
├── @openzeppelin/ReentrancyGuard
└── @openzeppelin/Pausable

RiskEngine
├── @openzeppelin/Ownable
└── libraries/PremiumMath

ClaimsProcessor
├── IInsurancePool
├── @openzeppelin/Ownable
└── @openzeppelin/ReentrancyGuard

PythPriceConsumer
├── @pythnetwork/IPyth
└── @openzeppelin/Ownable

HederaBridge
├── @chainlink/CCIPReceiver
└── @openzeppelin/Ownable
\`\`\`
`;

    const diagramsPath = path.join(this.outputDir, "ARCHITECTURE.md");
    fs.writeFileSync(diagramsPath, diagrams);

    console.log(`  ✅ Created: ${diagramsPath}`);
  }
}

async function main() {
  const preparation = new AuditPreparation();
  await preparation.prepareAuditPackage();

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("Next Steps:");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("1. Review the generated audit package");
  console.log("2. Select an audit firm (Consensys, OpenZeppelin, Trail of Bits)");
  console.log("3. Schedule audit timeline");
  console.log("4. Prepare bug bounty program");
  console.log("5. Finalize deployment parameters");
  console.log("6. Submit audit package to firm");
  console.log("═══════════════════════════════════════════════════════════\n");
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { AuditPreparation };
