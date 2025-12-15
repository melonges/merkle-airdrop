import fs from "node:fs";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import type { Address, Hex } from "viem";
import { getAddress } from "viem";
import {
  type FixedAmountEntry,
  type VariableAmountEntry,
} from "./types.js";
import { loadTree } from "./load.js";

export interface ProofResult {
  proof: Hex[];
  index: bigint;
  address: Address;
  amount?: bigint;
  leaf: Hex;
  valid: boolean;
}

export function getProofByAddress(
  tree: StandardMerkleTree<FixedAmountEntry>,
  address: Address
): ProofResult | null {
  const normalizedAddress = getAddress(address);

  for (const [i, [index, addr]] of tree.entries()) {
    if (getAddress(addr) === normalizedAddress) {
      const proof = tree.getProof(i) as Hex[];
      const leaf = tree.leafHash([index, addr]) as Hex;
      return {
        proof,
        index,
        address: normalizedAddress,
        leaf,
        valid: tree.verify(i, proof),
      };
    }
  }

  return null;
}

export function getProofByAddressVariable(
  tree: StandardMerkleTree<VariableAmountEntry>,
  address: Address
): ProofResult | null {
  const normalizedAddress = getAddress(address);

  for (const [i, [index, addr, amount]] of tree.entries()) {
    if (getAddress(addr) === normalizedAddress) {
      const proof = tree.getProof(i) as Hex[];
      const leaf = tree.leafHash([index, addr, amount]) as Hex;
      return {
        proof,
        index,
        address: normalizedAddress,
        amount,
        leaf,
        valid: tree.verify(i, proof),
      };
    }
  }

  return null;
}

export function getProofByIndex<T extends FixedAmountEntry | VariableAmountEntry>(
  tree: StandardMerkleTree<T>,
  entryIndex: number
): { proof: Hex[]; value: T; leaf: Hex; valid: boolean } | null {
  for (const [i, value] of tree.entries()) {
    if (i === entryIndex) {
      const proof = tree.getProof(i) as Hex[];
      const leaf = tree.leafHash(value) as Hex;
      return {
        proof,
        value,
        leaf,
        valid: tree.verify(i, proof),
      };
    }
  }
  return null;
}

export function getAllProofs<T extends FixedAmountEntry | VariableAmountEntry>(
  tree: StandardMerkleTree<T>
): { index: number; value: T; proof: Hex[] }[] {
  const results: { index: number; value: T; proof: Hex[] }[] = [];

  for (const [i, value] of tree.entries()) {
    results.push({
      index: i,
      value,
      proof: tree.getProof(i) as Hex[],
    });
  }

  return results;
}

export function exportProofsToFile<T extends FixedAmountEntry | VariableAmountEntry>(
  tree: StandardMerkleTree<T>,
  format: "fixed" | "variable",
  filePath: string
): void {
  const proofs: Record<string, { index: string; proof: Hex[]; amount?: string }> = {};

  for (const [i, value] of tree.entries()) {
    const address = getAddress(value[1] as Address);
    const proof = tree.getProof(i) as Hex[];

    if (format === "fixed") {
      const [index] = value as FixedAmountEntry;
      proofs[address] = {
        index: index.toString(),
        proof,
      };
    } else {
      const [index, , amount] = value as VariableAmountEntry;
      proofs[address] = {
        index: index.toString(),
        proof,
        amount: amount.toString(),
      };
    }
  }

  const dir = filePath.substring(0, filePath.lastIndexOf("/"));
  if (dir && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(
    filePath,
    JSON.stringify({ root: tree.root, format, proofs }, null, 2)
  );
  console.log(`Proofs exported to: ${filePath}`);
}

if (process.argv[1]?.endsWith("proof.ts") || process.argv[1]?.endsWith("proof.js")) {
  const treePath = process.argv[2];
  const address = process.argv[3] as Address | undefined;

  if (!treePath) {
    console.log("Usage: npx ts-node scripts/merkle/proof.ts <tree.json> [address]");
    console.log("  If address is provided, shows proof for that address");
    console.log("  If no address, shows all proofs");
    process.exit(1);
  }

  if (!fs.existsSync(treePath)) {
    console.error(`File not found: ${treePath}`);
    process.exit(1);
  }

  const tree = loadTree(treePath);
  console.log("Tree root:", tree.root);

  if (address) {
    const normalizedAddress = getAddress(address);
    let found = false;

    for (const [i, value] of tree.entries()) {
      if (getAddress(value[1] as Address) === normalizedAddress) {
        const proof = tree.getProof(i);
        console.log(`\nProof for ${normalizedAddress}:`);
        console.log("  Entry index:", i);
        console.log("  Value:", value);
        console.log("  Proof:", JSON.stringify(proof, null, 2));
        console.log("  Valid:", tree.verify(i, proof));
        found = true;
        break;
      }
    }

    if (!found) {
      console.log(`\nAddress ${normalizedAddress} not found in tree`);
    }
  } else {
    console.log("\nAll proofs:");
    for (const [i, value] of tree.entries()) {
      const proof = tree.getProof(i);
      console.log(`\n  Entry ${i}:`);
      console.log("    Value:", value);
      console.log("    Proof:", proof);
    }
  }
}
