import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import type { Address } from "viem";
import {
  type AirdropEntry,
  type FixedAmountEntry,
  type VariableAmountEntry,
  FIXED_AMOUNT_ENCODING,
  VARIABLE_AMOUNT_ENCODING,
} from "./types.js";

export function generateFixedAmountTree(entries: FixedAmountEntry[]) {
  return StandardMerkleTree.of(entries, FIXED_AMOUNT_ENCODING as unknown as string[]);
}

export function generateVariableAmountTree(entries: VariableAmountEntry[]) {
  return StandardMerkleTree.of(entries, VARIABLE_AMOUNT_ENCODING as unknown as string[]);
}

export function createFixedAmountEntries(addresses: Address[]): FixedAmountEntry[] {
  return addresses.map((address, index) => [BigInt(index), address]);
}

export function createVariableAmountEntries(
  data: { address: Address; amount: bigint }[]
): VariableAmountEntry[] {
  return data.map(({ address, amount }, index) => [BigInt(index), address, amount]);
}

if (process.argv[1]?.endsWith("generate.ts") || process.argv[1]?.endsWith("generate.js")) {
  const exampleAddresses: Address[] = [
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
  ];

  console.log("=== Fixed Amount Tree Example ===");
  const fixedEntries = createFixedAmountEntries(exampleAddresses);
  const fixedTree = generateFixedAmountTree(fixedEntries);
  console.log("Root:", fixedTree.root);
  console.log("Entries:", fixedEntries);

  console.log("\n=== Variable Amount Tree Example ===");
  const variableData = exampleAddresses.map((address, i) => ({
    address,
    amount: BigInt((i + 1) * 1000) * 10n ** 18n,
  }));
  const variableEntries = createVariableAmountEntries(variableData);
  const variableTree = generateVariableAmountTree(variableEntries);
  console.log("Root:", variableTree.root);
  console.log("Entries:", variableEntries.map(([i, addr, amt]) => [i.toString(), addr, amt.toString()]));
}
