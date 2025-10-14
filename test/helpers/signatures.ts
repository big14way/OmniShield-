import { ethers } from "hardhat";
import { Signature } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * EIP-712 Domain separator for permits
 */
export interface EIP712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

/**
 * Generate EIP-2612 permit signature
 * @param signer Signer object
 * @param token Token contract address
 * @param spender Spender address
 * @param value Amount to approve
 * @param nonce Current nonce
 * @param deadline Deadline timestamp
 * @param domain EIP-712 domain
 * @returns Signature components (v, r, s)
 */
export async function generatePermitSignature(
  signer: HardhatEthersSigner,
  token: string,
  spender: string,
  value: bigint,
  nonce: number,
  deadline: number,
  domain?: EIP712Domain
): Promise<{ v: number; r: string; s: string }> {
  const defaultDomain: EIP712Domain = domain || {
    name: "Token",
    version: "1",
    chainId: 31337,
    verifyingContract: token,
  };

  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };

  const message = {
    owner: await signer.getAddress(),
    spender,
    value,
    nonce,
    deadline,
  };

  const signature = await signer.signTypedData(defaultDomain, types, message);
  const sig = Signature.from(signature);

  return {
    v: sig.v,
    r: sig.r,
    s: sig.s,
  };
}

/**
 * Generate meta-transaction signature
 * @param signer Signer object
 * @param from From address
 * @param to To address
 * @param value Value to send
 * @param data Call data
 * @param nonce Nonce
 * @param domain EIP-712 domain
 * @returns Signature string
 */
export async function generateMetaTxSignature(
  signer: HardhatEthersSigner,
  from: string,
  to: string,
  value: bigint,
  data: string,
  nonce: number,
  domain: EIP712Domain
): Promise<string> {
  const types = {
    MetaTransaction: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "data", type: "bytes" },
      { name: "nonce", type: "uint256" },
    ],
  };

  const message = {
    from,
    to,
    value,
    data,
    nonce,
  };

  return await signer.signTypedData(domain, types, message);
}

/**
 * Generate simple message signature
 * @param signer Signer object
 * @param message Message to sign
 * @returns Signature string
 */
export async function signMessage(signer: HardhatEthersSigner, message: string): Promise<string> {
  return await signer.signMessage(message);
}

/**
 * Recover signer address from signature
 * @param message Original message
 * @param signature Signature string
 * @returns Recovered address
 */
export function recoverSigner(message: string, signature: string): string {
  return ethers.verifyMessage(message, signature);
}

/**
 * Split signature into components
 * @param signature Signature string
 * @returns Signature components (v, r, s)
 */
export function splitSignature(signature: string): { v: number; r: string; s: string } {
  const sig = Signature.from(signature);
  return {
    v: sig.v,
    r: sig.r,
    s: sig.s,
  };
}

/**
 * Generate claim signature for insurance
 * @param signer Signer object
 * @param policyId Policy ID
 * @param claimAmount Claim amount
 * @param evidence Evidence hash
 * @param domain EIP-712 domain
 * @returns Signature string
 */
export async function generateClaimSignature(
  signer: HardhatEthersSigner,
  policyId: number,
  claimAmount: bigint,
  evidence: string,
  domain: EIP712Domain
): Promise<string> {
  const types = {
    Claim: [
      { name: "policyId", type: "uint256" },
      { name: "claimAmount", type: "uint256" },
      { name: "evidence", type: "bytes32" },
    ],
  };

  const message = {
    policyId,
    claimAmount,
    evidence,
  };

  return await signer.signTypedData(domain, types, message);
}
