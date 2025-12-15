import fs from "node:fs";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import type { Address } from "viem";
import {
  type FixedAmountEntry,
  type VariableAmountEntry,
  type MerkleTreeData,
  FIXED_AMOUNT_ENCODING,
  VARIABLE_AMOUNT_ENCODING,
} from "./types.js";

export function loadTree<T extends FixedAmountEntry | VariableAmountEntry>(
  filePath: string
): StandardMerkleTree<T> {
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return StandardMerkleTree.load(data) as StandardMerkleTree<T>;
}

export function loadFixedAmountTree(filePath: string): StandardMerkleTree<FixedAmountEntry> {
  return loadTree<FixedAmountEntry>(filePath);
}

export function loadVariableAmountTree(filePath: string): StandardMerkleTree<VariableAmountEntry> {
  return loadTree<VariableAmountEntry>(filePath);
}

export function loadTreeFromMetadata(
  filePath: string
): StandardMerkleTree<FixedAmountEntry> | StandardMerkleTree<VariableAmountEntry> {
  const data: MerkleTreeData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  if (data.format === "fixed") {
    const entries: FixedAmountEntry[] = data.entries.map((e) => [
      BigInt(e.index),
      e.address,
    ]);
    return StandardMerkleTree.of(entries, FIXED_AMOUNT_ENCODING as unknown as string[]);
  } else {
    const entries: VariableAmountEntry[] = data.entries.map((e) => [
      BigInt(e.index),
      e.address,
      BigInt(e.amount!),
    ]);
    return StandardMerkleTree.of(entries, VARIABLE_AMOUNT_ENCODING as unknown as string[]);
  }
}

if (process.argv[1]?.endsWith("load.ts") || process.argv[1]?.endsWith("load.js")) {
  const filePath = process.argv[2] || "./data/merkle-tree.json";

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    console.log("Usage: npx ts-node scripts/merkle/load.ts <path-to-tree.json>");
    process.exit(1);
  }

  const tree = loadTree(filePath);
  console.log("Loaded Merkle Tree");
  console.log("Root:", tree.root);
  console.log("Entries:");
  for (const [i, v] of tree.entries()) {
    console.log(`  ${i}:`, v);
  }
}
