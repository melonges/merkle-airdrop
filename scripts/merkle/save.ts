import fs from "node:fs";
import path from "node:path";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import type { Address } from "viem";
import {
  type FixedAmountEntry,
  type VariableAmountEntry,
  type MerkleTreeData,
  FIXED_AMOUNT_ENCODING,
  VARIABLE_AMOUNT_ENCODING,
} from "./types.js";

function bigIntReplacer(_key: string, value: unknown): unknown {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
}

export function saveTree(
  tree: StandardMerkleTree<FixedAmountEntry> | StandardMerkleTree<VariableAmountEntry>,
  filePath: string
): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(tree.dump(), bigIntReplacer, 2));
  console.log(`Merkle tree saved to: ${filePath}`);
  console.log(`Root: ${tree.root}`);
}

export function saveTreeWithMetadata(
  tree: StandardMerkleTree<FixedAmountEntry> | StandardMerkleTree<VariableAmountEntry>,
  format: "fixed" | "variable",
  filePath: string
): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const entries: MerkleTreeData["entries"] = [];

  for (const [i, v] of tree.entries()) {
    if (format === "fixed") {
      const [index, address] = v as FixedAmountEntry;
      entries.push({
        index: index.toString(),
        address: address as Address,
      });
    } else {
      const [index, address, amount] = v as VariableAmountEntry;
      entries.push({
        index: index.toString(),
        address: address as Address,
        amount: amount.toString(),
      });
    }
  }

  const data: MerkleTreeData = {
    root: tree.root as `0x${string}`,
    format,
    entries,
  };

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Merkle tree metadata saved to: ${filePath}`);
}

if (process.argv[1]?.endsWith("save.ts") || process.argv[1]?.endsWith("save.js")) {
  const exampleAddresses: Address[] = [
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
  ];

  const entries: FixedAmountEntry[] = exampleAddresses.map((addr, i) => [BigInt(i), addr]);
  const tree = StandardMerkleTree.of(entries, FIXED_AMOUNT_ENCODING as unknown as string[]);

  saveTree(tree, "./data/merkle-tree.json");
  saveTreeWithMetadata(tree, "fixed", "./data/merkle-tree-metadata.json");
}
