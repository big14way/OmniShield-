import { ethers } from "hardhat";

/**
 * Coverage data factory for creating test coverage objects
 */

export interface CoverageParams {
  holder: string;
  coverageAmount: bigint;
  duration: number;
  premium?: bigint;
  startTime?: number;
  endTime?: number;
}

/**
 * Create coverage data object
 * @param params Coverage parameters
 * @returns Coverage object
 */
export function createCoverage(params: CoverageParams) {
  const now = Math.floor(Date.now() / 1000);

  return {
    holder: params.holder,
    coverageAmount: params.coverageAmount,
    duration: params.duration,
    premium: params.premium || ethers.parseEther("0.1"),
    startTime: params.startTime || now,
    endTime: params.endTime || now + params.duration,
  };
}

/**
 * Standard coverage amounts for testing
 */
export const COVERAGE_AMOUNTS = {
  SMALL: ethers.parseEther("1"),
  MEDIUM: ethers.parseEther("10"),
  LARGE: ethers.parseEther("100"),
  XLARGE: ethers.parseEther("1000"),
};

/**
 * Standard coverage durations
 */
export const COVERAGE_DURATIONS = {
  ONE_DAY: 86400,
  ONE_WEEK: 604800,
  ONE_MONTH: 2592000,
  THREE_MONTHS: 7776000,
  SIX_MONTHS: 15552000,
  ONE_YEAR: 31536000,
};

/**
 * Calculate expected premium (simplified)
 * @param coverageAmount Coverage amount
 * @param duration Duration in seconds
 * @param riskScore Risk score (0-100)
 * @returns Expected premium
 */
export function calculateExpectedPremium(
  coverageAmount: bigint,
  duration: number,
  riskScore: number
): bigint {
  // Base rate: 1% per year
  const annualRate = 100n; // 1%
  const durationYears = BigInt(duration) / 31536000n;

  // Premium = coverageAmount * rate * duration * riskMultiplier
  const basePremium = (coverageAmount * annualRate * durationYears) / 10000n;
  const riskMultiplier = 100n + BigInt(riskScore);

  return (basePremium * riskMultiplier) / 100n;
}

/**
 * Generate random coverage parameters
 * @param holder Holder address
 * @returns Random coverage parameters
 */
export function generateRandomCoverage(holder: string): CoverageParams {
  const amounts = Object.values(COVERAGE_AMOUNTS);
  const durations = Object.values(COVERAGE_DURATIONS);

  return {
    holder,
    coverageAmount: amounts[Math.floor(Math.random() * amounts.length)],
    duration: durations[Math.floor(Math.random() * durations.length)],
  };
}

/**
 * Create batch of coverage data for testing
 * @param count Number of coverage objects
 * @param holder Holder address
 * @returns Array of coverage parameters
 */
export function createCoverageBatch(count: number, holder: string): CoverageParams[] {
  const batch: CoverageParams[] = [];

  for (let i = 0; i < count; i++) {
    batch.push(generateRandomCoverage(holder));
  }

  return batch;
}

/**
 * Claim data factory
 */
export interface ClaimParams {
  policyId: number;
  claimAmount: bigint;
  evidence: string;
  timestamp?: number;
}

/**
 * Create claim data
 * @param params Claim parameters
 * @returns Claim object
 */
export function createClaim(params: ClaimParams) {
  return {
    policyId: params.policyId,
    claimAmount: params.claimAmount,
    evidence: params.evidence || ethers.keccak256(ethers.toUtf8Bytes("evidence")),
    timestamp: params.timestamp || Math.floor(Date.now() / 1000),
  };
}

/**
 * Generate evidence hash
 * @param data Evidence data
 * @returns Evidence hash
 */
export function generateEvidenceHash(data: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(data));
}
