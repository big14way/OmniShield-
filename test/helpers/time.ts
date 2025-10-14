import { ethers, network } from "hardhat";

/**
 * Increase the blockchain time by a specified duration
 * @param seconds Number of seconds to increase time by
 */
export async function increaseTime(seconds: number): Promise<void> {
  await network.provider.send("evm_increaseTime", [seconds]);
  await network.provider.send("evm_mine");
}

/**
 * Set the blockchain time to a specific timestamp
 * @param timestamp Unix timestamp to set
 */
export async function setTime(timestamp: number): Promise<void> {
  await network.provider.send("evm_setNextBlockTimestamp", [timestamp]);
  await network.provider.send("evm_mine");
}

/**
 * Get the current blockchain time
 * @returns Current block timestamp
 */
export async function currentTime(): Promise<number> {
  const block = await ethers.provider.getBlock("latest");
  return block!.timestamp;
}

/**
 * Mine a specified number of blocks
 * @param blocks Number of blocks to mine
 */
export async function mineBlocks(blocks: number): Promise<void> {
  for (let i = 0; i < blocks; i++) {
    await network.provider.send("evm_mine");
  }
}

/**
 * Take a snapshot of the blockchain state
 * @returns Snapshot ID
 */
export async function takeSnapshot(): Promise<string> {
  return await network.provider.send("evm_snapshot");
}

/**
 * Revert the blockchain to a previous snapshot
 * @param snapshotId Snapshot ID to revert to
 */
export async function revertToSnapshot(snapshotId: string): Promise<void> {
  await network.provider.send("evm_revert", [snapshotId]);
}

/**
 * Helper to execute a function at a specific time
 * @param timestamp Unix timestamp to execute at
 * @param fn Function to execute
 */
export async function executeAt(timestamp: number, fn: () => Promise<any>): Promise<any> {
  await setTime(timestamp);
  return await fn();
}

/**
 * Constants for common time durations
 */
export const SECONDS_PER_DAY = 86400;
export const SECONDS_PER_WEEK = 604800;
export const SECONDS_PER_MONTH = 2592000; // 30 days
export const SECONDS_PER_YEAR = 31536000; // 365 days
