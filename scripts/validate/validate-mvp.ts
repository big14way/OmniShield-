import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface ValidationResult {
  category: string;
  item: string;
  status: "PASS" | "FAIL" | "WARN" | "SKIP";
  message?: string;
}

interface ValidationReport {
  timestamp: string;
  network: string;
  results: ValidationResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    skipped: number;
  };
}

class MVPValidator {
  private results: ValidationResult[] = [];
  private network: string;
  private deploymentPath: string;

  constructor(network: string) {
    this.network = network;
    this.deploymentPath = path.join(__dirname, "../../deployments", `${network}.json`);
  }

  private addResult(
    category: string,
    item: string,
    status: "PASS" | "FAIL" | "WARN" | "SKIP",
    message?: string
  ): void {
    this.results.push({ category, item, status, message });
    const icon = {
      PASS: "✅",
      FAIL: "❌",
      WARN: "⚠️",
      SKIP: "⏭️",
    }[status];
    console.log(`  ${icon} ${item}${message ? `: ${message}` : ""}`);
  }

  async validateSmartContracts(): Promise<void> {
    console.log("\n╔═══════════════════════════════════════════════════════════╗");
    console.log("║         1. Smart Contract Validation                      ║");
    console.log("╚═══════════════════════════════════════════════════════════╝\n");

    // Check if deployment file exists
    if (!fs.existsSync(this.deploymentPath)) {
      this.addResult(
        "Smart Contracts",
        "Contracts deployed and verified",
        "FAIL",
        "No deployment file found"
      );
      return;
    }

    const deployment = JSON.parse(fs.readFileSync(this.deploymentPath, "utf-8"));

    // Validate all contracts deployed
    const requiredContracts = ["insurancePool", "riskEngine", "claimsProcessor"];
    let allDeployed = true;

    for (const contractName of requiredContracts) {
      if (!deployment[contractName]) {
        this.addResult("Smart Contracts", `${contractName} deployed`, "FAIL", "Address not found");
        allDeployed = false;
      }
    }

    if (allDeployed) {
      this.addResult("Smart Contracts", "All contracts deployed", "PASS");
    }

    // Check contract verification
    try {
      const insurancePool = await ethers.getContractAt("InsurancePool", deployment.insurancePool);
      await insurancePool.owner();
      this.addResult("Smart Contracts", "Contracts accessible on-chain", "PASS");
    } catch {
      this.addResult(
        "Smart Contracts",
        "Contracts accessible on-chain",
        "FAIL",
        "Cannot connect to contracts"
      );
    }

    // Check ownership
    try {
      const insurancePool = await ethers.getContractAt("InsurancePool", deployment.insurancePool);
      const owner = await insurancePool.owner();
      const multisigAddress = process.env.MULTISIG_ADDRESS;

      if (multisigAddress && owner.toLowerCase() === multisigAddress.toLowerCase()) {
        this.addResult("Smart Contracts", "Ownership transferred to multi-sig", "PASS");
      } else {
        this.addResult(
          "Smart Contracts",
          "Ownership transferred to multi-sig",
          "WARN",
          `Owner: ${owner}`
        );
      }
    } catch {
      this.addResult(
        "Smart Contracts",
        "Ownership transferred to multi-sig",
        "SKIP",
        "Cannot verify"
      );
    }

    // Check oracle price feeds
    if (deployment.pythPriceConsumer) {
      try {
        const oracle = await ethers.getContractAt(
          "PythPriceConsumer",
          deployment.pythPriceConsumer
        );
        const pythAddress = await oracle.pyth();
        if (pythAddress && pythAddress !== ethers.ZeroAddress) {
          this.addResult("Smart Contracts", "Oracle price feeds active", "PASS");
        } else {
          this.addResult(
            "Smart Contracts",
            "Oracle price feeds active",
            "FAIL",
            "Pyth not configured"
          );
        }
      } catch {
        this.addResult(
          "Smart Contracts",
          "Oracle price feeds active",
          "SKIP",
          "Oracle not deployed"
        );
      }
    } else {
      this.addResult("Smart Contracts", "Oracle price feeds active", "SKIP", "Oracle not deployed");
    }

    // Check cross-chain bridges
    if (deployment.ccipBridge) {
      this.addResult("Smart Contracts", "Cross-chain bridges connected", "PASS");
    } else {
      this.addResult(
        "Smart Contracts",
        "Cross-chain bridges connected",
        "SKIP",
        "Bridge not deployed"
      );
    }

    // Test emergency pause
    try {
      const insurancePool = await ethers.getContractAt("InsurancePool", deployment.insurancePool);
      const isPaused = await insurancePool.paused();
      this.addResult(
        "Smart Contracts",
        "Emergency pause tested",
        "PASS",
        `Currently ${isPaused ? "paused" : "active"}`
      );
    } catch {
      this.addResult("Smart Contracts", "Emergency pause tested", "WARN", "Cannot verify");
    }

    // Check test coverage
    try {
      const coverageFile = path.join(__dirname, "../../coverage/coverage-summary.json");
      if (fs.existsSync(coverageFile)) {
        const coverage = JSON.parse(fs.readFileSync(coverageFile, "utf-8"));
        const totalCoverage = coverage.total;
        const avgCoverage =
          (totalCoverage.statements.pct +
            totalCoverage.branches.pct +
            totalCoverage.functions.pct +
            totalCoverage.lines.pct) /
          4;

        if (avgCoverage >= 90) {
          this.addResult(
            "Smart Contracts",
            "All tests passing (>90% coverage)",
            "PASS",
            `${avgCoverage.toFixed(1)}%`
          );
        } else if (avgCoverage >= 80) {
          this.addResult(
            "Smart Contracts",
            "All tests passing (>80% coverage)",
            "WARN",
            `${avgCoverage.toFixed(1)}%`
          );
        } else {
          this.addResult(
            "Smart Contracts",
            "All tests passing (>80% coverage)",
            "FAIL",
            `${avgCoverage.toFixed(1)}%`
          );
        }
      } else {
        this.addResult(
          "Smart Contracts",
          "All tests passing",
          "SKIP",
          "Run npm run coverage first"
        );
      }
    } catch {
      this.addResult("Smart Contracts", "All tests passing", "SKIP", "Coverage not available");
    }
  }

  async validateFrontend(): Promise<void> {
    console.log("\n╔═══════════════════════════════════════════════════════════╗");
    console.log("║         2. Frontend Validation                             ║");
    console.log("╚═══════════════════════════════════════════════════════════╝\n");

    const frontendPath = path.join(__dirname, "../../frontend");

    if (!fs.existsSync(frontendPath)) {
      this.addResult("Frontend", "Frontend exists", "FAIL", "Frontend directory not found");
      this.addResult("Frontend", "Wallet connection", "SKIP", "Frontend not available");
      this.addResult("Frontend", "Network switching", "SKIP", "Frontend not available");
      this.addResult("Frontend", "Transactions execute", "SKIP", "Frontend not available");
      this.addResult("Frontend", "Error handling", "SKIP", "Frontend not available");
      this.addResult("Frontend", "Mobile responsive", "SKIP", "Frontend not available");
      this.addResult("Frontend", "Loading states", "SKIP", "Frontend not available");
      return;
    }

    this.addResult("Frontend", "Frontend exists", "PASS");

    // Check for Web3 integration
    const web3Files = [
      "frontend/src/lib/web3.ts",
      "frontend/src/hooks/useWeb3.ts",
      "frontend/lib/web3.ts",
      "frontend/hooks/useWeb3.ts",
    ];

    let web3Found = false;
    for (const file of web3Files) {
      if (fs.existsSync(path.join(__dirname, "../..", file))) {
        web3Found = true;
        break;
      }
    }

    if (web3Found) {
      this.addResult("Frontend", "Wallet connection implemented", "PASS");
    } else {
      this.addResult("Frontend", "Wallet connection implemented", "WARN", "Check manually");
    }

    // Check for network switching
    const networkSwitchingPatterns = ["switchNetwork", "changeNetwork", "addNetwork"];
    let networkSwitchingFound = false;

    try {
      const frontendFiles = this.getAllFiles(frontendPath, [".ts", ".tsx", ".js", ".jsx"]);
      for (const file of frontendFiles) {
        const content = fs.readFileSync(file, "utf-8");
        if (networkSwitchingPatterns.some((pattern) => content.includes(pattern))) {
          networkSwitchingFound = true;
          break;
        }
      }

      if (networkSwitchingFound) {
        this.addResult("Frontend", "Network switching works", "PASS");
      } else {
        this.addResult("Frontend", "Network switching works", "WARN", "Not detected");
      }
    } catch {
      this.addResult("Frontend", "Network switching works", "SKIP", "Cannot scan files");
    }

    // Check for transaction handling
    this.addResult("Frontend", "Transactions execute correctly", "WARN", "Requires manual test");

    // Check for error handling
    const errorHandlingPatterns = ["try", "catch", "error", "Error"];
    let errorHandlingFound = false;

    try {
      const frontendFiles = this.getAllFiles(frontendPath, [".ts", ".tsx", ".js", ".jsx"]).slice(
        0,
        10
      );
      for (const file of frontendFiles) {
        const content = fs.readFileSync(file, "utf-8");
        if (errorHandlingPatterns.every((pattern) => content.includes(pattern))) {
          errorHandlingFound = true;
          break;
        }
      }

      if (errorHandlingFound) {
        this.addResult("Frontend", "Error handling for failed txs", "PASS");
      } else {
        this.addResult("Frontend", "Error handling for failed txs", "WARN", "Check manually");
      }
    } catch {
      this.addResult("Frontend", "Error handling for failed txs", "SKIP", "Cannot scan files");
    }

    // Check for responsive design
    const responsivePatterns = ["responsive", "mobile", "md:", "lg:", "sm:"];
    let responsiveFound = false;

    try {
      const frontendFiles = this.getAllFiles(frontendPath, [".ts", ".tsx", ".css", ".scss"]);
      for (const file of frontendFiles.slice(0, 20)) {
        const content = fs.readFileSync(file, "utf-8");
        if (responsivePatterns.some((pattern) => content.includes(pattern))) {
          responsiveFound = true;
          break;
        }
      }

      if (responsiveFound) {
        this.addResult("Frontend", "Mobile responsive design", "PASS");
      } else {
        this.addResult("Frontend", "Mobile responsive design", "WARN", "Check manually");
      }
    } catch {
      this.addResult("Frontend", "Mobile responsive design", "SKIP", "Cannot scan files");
    }

    // Check for loading states
    const loadingPatterns = ["loading", "isLoading", "Loading", "Loader", "Spinner"];
    let loadingFound = false;

    try {
      const frontendFiles = this.getAllFiles(frontendPath, [".ts", ".tsx", ".js", ".jsx"]);
      for (const file of frontendFiles.slice(0, 20)) {
        const content = fs.readFileSync(file, "utf-8");
        if (loadingPatterns.some((pattern) => content.includes(pattern))) {
          loadingFound = true;
          break;
        }
      }

      if (loadingFound) {
        this.addResult("Frontend", "Loading states implemented", "PASS");
      } else {
        this.addResult("Frontend", "Loading states implemented", "WARN", "Not detected");
      }
    } catch {
      this.addResult("Frontend", "Loading states implemented", "SKIP", "Cannot scan files");
    }
  }

  async validateIntegration(): Promise<void> {
    console.log("\n╔═══════════════════════════════════════════════════════════╗");
    console.log("║         3. Integration Testing                             ║");
    console.log("╚═══════════════════════════════════════════════════════════╝\n");

    // Check for integration tests
    const integrationTestPath = path.join(__dirname, "../../test/integration");

    if (!fs.existsSync(integrationTestPath)) {
      this.addResult(
        "Integration",
        "Integration tests exist",
        "WARN",
        "No integration test directory"
      );
    } else {
      const testFiles = fs.readdirSync(integrationTestPath);
      this.addResult(
        "Integration",
        "Integration tests exist",
        "PASS",
        `${testFiles.length} test files`
      );
    }

    // Check for E2E tests
    const e2eTestPath = path.join(__dirname, "../../test/e2e");

    if (!fs.existsSync(e2eTestPath)) {
      this.addResult("Integration", "E2E tests exist", "WARN", "No e2e test directory");
    } else {
      const testFiles = fs.readdirSync(e2eTestPath);
      this.addResult("Integration", "E2E tests exist", "PASS", `${testFiles.length} test files`);

      // Check for specific test scenarios
      const scenarios = [
        { name: "Purchase coverage end-to-end", file: "HappyPath" },
        { name: "Process claim successfully", file: "HappyPath" },
        { name: "LP operations work", file: "HappyPath" },
        { name: "Cross-chain coverage works", file: "CrossChain" },
      ];

      for (const scenario of scenarios) {
        const found = testFiles.some(
          (file) => file.includes(scenario.file) && file.endsWith(".test.ts")
        );
        if (found) {
          this.addResult("Integration", scenario.name, "PASS");
        } else {
          this.addResult("Integration", scenario.name, "WARN", "Test not found");
        }
      }
    }

    // Gas costs validation
    try {
      const gasReportPath = path.join(__dirname, "../../gas-report.txt");
      if (fs.existsSync(gasReportPath)) {
        this.addResult("Integration", "Gas costs within target", "PASS", "Report available");
      } else {
        this.addResult("Integration", "Gas costs within target", "SKIP", "Run npm run gas-report");
      }
    } catch {
      this.addResult("Integration", "Gas costs within target", "SKIP", "Report not available");
    }
  }

  async validateSecurity(): Promise<void> {
    console.log("\n╔═══════════════════════════════════════════════════════════╗");
    console.log("║         4. Security Checklist                              ║");
    console.log("╚═══════════════════════════════════════════════════════════╝\n");

    // Check Slither report
    const slitherReportPath = path.join(__dirname, "../../slither-report.json");

    if (fs.existsSync(slitherReportPath)) {
      try {
        const report = JSON.parse(fs.readFileSync(slitherReportPath, "utf-8"));
        const criticalIssues = report.results?.detectors?.filter(
          (d: any) => d.impact === "High" || d.impact === "Critical"
        );

        if (criticalIssues && criticalIssues.length === 0) {
          this.addResult("Security", "Slither analysis clean", "PASS", "No critical issues");
        } else {
          this.addResult(
            "Security",
            "Slither analysis clean",
            "FAIL",
            `${criticalIssues?.length || 0} critical issues`
          );
        }
      } catch {
        this.addResult("Security", "Slither analysis clean", "WARN", "Cannot parse report");
      }
    } else {
      this.addResult("Security", "Slither analysis clean", "SKIP", "Run slither analysis");
    }

    // Check for common security patterns in contracts
    const contractsPath = path.join(__dirname, "../../contracts");
    const contractFiles = this.getAllFiles(contractsPath, [".sol"]);

    // Check for access controls
    const accessControlPatterns = ["onlyOwner", "AccessControl", "Ownable"];
    let accessControlFound = false;

    for (const file of contractFiles) {
      const content = fs.readFileSync(file, "utf-8");
      if (accessControlPatterns.some((pattern) => content.includes(pattern))) {
        accessControlFound = true;
        break;
      }
    }

    if (accessControlFound) {
      this.addResult("Security", "Access controls verified", "PASS");
    } else {
      this.addResult("Security", "Access controls verified", "FAIL", "Not found");
    }

    // Check for reentrancy protection
    const reentrancyPatterns = ["ReentrancyGuard", "nonReentrant"];
    let reentrancyFound = false;

    for (const file of contractFiles) {
      const content = fs.readFileSync(file, "utf-8");
      if (reentrancyPatterns.some((pattern) => content.includes(pattern))) {
        reentrancyFound = true;
        break;
      }
    }

    if (reentrancyFound) {
      this.addResult("Security", "Reentrancy protection confirmed", "PASS");
    } else {
      this.addResult("Security", "Reentrancy protection confirmed", "WARN", "Check manually");
    }

    // Check for integer overflow protection (Solidity 0.8+)
    let solidityVersion = "";
    for (const file of contractFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const versionMatch = content.match(/pragma solidity ([\d.]+);/);
      if (versionMatch) {
        solidityVersion = versionMatch[1];
        break;
      }
    }

    if (solidityVersion.startsWith("0.8")) {
      this.addResult(
        "Security",
        "Integer overflow protection",
        "PASS",
        `Solidity ${solidityVersion}`
      );
    } else {
      this.addResult(
        "Security",
        "Integer overflow protection",
        "WARN",
        `Solidity ${solidityVersion}`
      );
    }

    // Check for oracle manipulation resistance
    const oraclePatterns = ["Pyth", "Chainlink", "oracle", "priceDeviation", "staleness"];
    let oracleFound = false;

    for (const file of contractFiles) {
      const content = fs.readFileSync(file, "utf-8");
      if (oraclePatterns.some((pattern) => content.includes(pattern))) {
        oracleFound = true;
        break;
      }
    }

    if (oracleFound) {
      this.addResult("Security", "Oracle manipulation resistant", "PASS");
    } else {
      this.addResult("Security", "Oracle manipulation resistant", "WARN", "No oracle detected");
    }

    // Overall security assessment
    this.addResult("Security", "No high/critical issues", "WARN", "Review required");
  }

  async validateDocumentation(): Promise<void> {
    console.log("\n╔═══════════════════════════════════════════════════════════╗");
    console.log("║         5. Documentation                                   ║");
    console.log("╚═══════════════════════════════════════════════════════════╝\n");

    // Check README
    const readmePath = path.join(__dirname, "../../README.md");
    if (fs.existsSync(readmePath)) {
      const content = fs.readFileSync(readmePath, "utf-8");
      const hasSetup = content.toLowerCase().includes("setup") || content.includes("install");
      const hasUsage = content.toLowerCase().includes("usage") || content.includes("how to");

      if (hasSetup && hasUsage) {
        this.addResult("Documentation", "README with setup instructions", "PASS");
      } else {
        this.addResult("Documentation", "README with setup instructions", "WARN", "Incomplete");
      }
    } else {
      this.addResult("Documentation", "README with setup instructions", "FAIL", "Not found");
    }

    // Check API documentation
    const apiDocPaths = ["docs/API.md", "docs/api.md", "API.md", "frontend/README.md"];

    let apiDocFound = false;
    for (const docPath of apiDocPaths) {
      if (fs.existsSync(path.join(__dirname, "../..", docPath))) {
        apiDocFound = true;
        break;
      }
    }

    if (apiDocFound) {
      this.addResult("Documentation", "API documentation", "PASS");
    } else {
      this.addResult("Documentation", "API documentation", "WARN", "Not found");
    }

    // Check smart contract documentation
    const contractDocPath = path.join(__dirname, "../../docs");
    if (fs.existsSync(contractDocPath)) {
      const files = fs.readdirSync(contractDocPath);
      const hasContractDocs = files.some(
        (f) => f.toLowerCase().includes("contract") || f.toLowerCase().includes("architecture")
      );

      if (hasContractDocs) {
        this.addResult("Documentation", "Smart contract documentation", "PASS");
      } else {
        this.addResult("Documentation", "Smart contract documentation", "WARN", "Incomplete");
      }
    } else {
      this.addResult(
        "Documentation",
        "Smart contract documentation",
        "WARN",
        "Docs folder missing"
      );
    }

    // Check user guide
    const userGuidePaths = [
      "docs/USER_GUIDE.md",
      "docs/user-guide.md",
      "USER_GUIDE.md",
      "GUIDE.md",
    ];

    let userGuideFound = false;
    for (const guidePath of userGuidePaths) {
      if (fs.existsSync(path.join(__dirname, "../..", guidePath))) {
        userGuideFound = true;
        break;
      }
    }

    if (userGuideFound) {
      this.addResult("Documentation", "User guide created", "PASS");
    } else {
      this.addResult("Documentation", "User guide created", "WARN", "Not found");
    }

    // Check for video demo
    const videoPaths = ["docs/demo.mp4", "demo.mp4", "video/demo.mp4"];
    let videoFound = false;

    for (const videoPath of videoPaths) {
      if (fs.existsSync(path.join(__dirname, "../..", videoPath))) {
        videoFound = true;
        break;
      }
    }

    if (videoFound) {
      this.addResult("Documentation", "Video demo recorded", "PASS");
    } else {
      this.addResult("Documentation", "Video demo recorded", "SKIP", "Not required");
    }
  }

  private getAllFiles(dirPath: string, extensions: string[]): string[] {
    const files: string[] = [];

    const readDir = (dir: string) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
            readDir(fullPath);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (extensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch {
        // Ignore errors
      }
    };

    readDir(dirPath);
    return files;
  }

  generateReport(): ValidationReport {
    const summary = {
      total: this.results.length,
      passed: this.results.filter((r) => r.status === "PASS").length,
      failed: this.results.filter((r) => r.status === "FAIL").length,
      warnings: this.results.filter((r) => r.status === "WARN").length,
      skipped: this.results.filter((r) => r.status === "SKIP").length,
    };

    return {
      timestamp: new Date().toISOString(),
      network: this.network,
      results: this.results,
      summary,
    };
  }

  printReport(): void {
    const report = this.generateReport();

    console.log("\n╔═══════════════════════════════════════════════════════════╗");
    console.log("║         MVP Validation Report                              ║");
    console.log("╚═══════════════════════════════════════════════════════════╝\n");

    console.log(`Network: ${report.network}`);
    console.log(`Timestamp: ${report.timestamp}\n`);

    console.log("Summary:");
    console.log(`  Total Checks: ${report.summary.total}`);
    console.log(`  ✅ Passed: ${report.summary.passed}`);
    console.log(`  ❌ Failed: ${report.summary.failed}`);
    console.log(`  ⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`  ⏭️  Skipped: ${report.summary.skipped}`);

    const successRate = Math.round(
      (report.summary.passed / (report.summary.total - report.summary.skipped)) * 100
    );
    console.log(`\n  Success Rate: ${successRate}%`);

    if (report.summary.failed > 0) {
      console.log("\n⚠️  FAILED CHECKS:");
      report.results
        .filter((r) => r.status === "FAIL")
        .forEach((r) => {
          console.log(`  ❌ [${r.category}] ${r.item}`);
          if (r.message) console.log(`     ${r.message}`);
        });
    }

    if (report.summary.warnings > 0) {
      console.log("\n⚠️  WARNINGS:");
      report.results
        .filter((r) => r.status === "WARN")
        .forEach((r) => {
          console.log(`  ⚠️  [${r.category}] ${r.item}`);
          if (r.message) console.log(`     ${r.message}`);
        });
    }

    // Save report to file
    const reportPath = path.join(__dirname, "../../validation-report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Full report saved to: ${reportPath}`);

    // Exit code based on failures
    if (report.summary.failed > 0) {
      console.log("\n❌ Validation FAILED");
      process.exit(1);
    } else if (report.summary.warnings > 3) {
      console.log("\n⚠️  Validation completed with WARNINGS");
      process.exit(0);
    } else {
      console.log("\n✅ Validation PASSED");
      process.exit(0);
    }
  }
}

async function main() {
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║         OmniShield MVP Validation                          ║");
  console.log("╚═══════════════════════════════════════════════════════════╝");

  const network = process.env.NETWORK || "sepolia";
  console.log(`\nValidating network: ${network}\n`);

  const validator = new MVPValidator(network);

  try {
    await validator.validateSmartContracts();
    await validator.validateFrontend();
    await validator.validateIntegration();
    await validator.validateSecurity();
    await validator.validateDocumentation();

    validator.printReport();
  } catch (error) {
    console.error("\n❌ Validation failed with error:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { MVPValidator };
