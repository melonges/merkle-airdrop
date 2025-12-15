import fs from "node:fs";
import type { Address } from "viem";
import { getAddress } from "viem";
import {
  loadTree,
  getProofByAddress,
  getProofByAddressVariable,
  type FixedAmountEntry,
  type VariableAmountEntry,
  type MerkleTreeData,
} from "./merkle/index.js";

const TREE_PATH = "./data/fixed-amount-tree.json";
const ADDRESS_TO_CHECK: Address = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const TREE_FORMAT: "fixed" | "variable" = "fixed";

async function main() {
  console.log("🔍 Merkle Proof Lookup\n");

  if (!fs.existsSync(TREE_PATH)) {
    console.error(`❌ Tree file not found: ${TREE_PATH}`);
    console.log("   Run 'npx hardhat run scripts/generate-airdrop-tree.ts' first");
    process.exit(1);
  }

  const normalizedAddress = getAddress(ADDRESS_TO_CHECK);
  console.log(`Tree: ${TREE_PATH}`);
  console.log(`Address: ${normalizedAddress}`);
  console.log(`Format: ${TREE_FORMAT}\n`);

  if (TREE_FORMAT === "fixed") {
    const tree = loadTree<FixedAmountEntry>(TREE_PATH);
    console.log(`Merkle Root: ${tree.root}\n`);

    const result = getProofByAddress(tree, normalizedAddress);

    if (result) {
      console.log("✅ Address found in tree!\n");
      console.log("Claim parameters for contract:");
      console.log("─".repeat(50));
      console.log(`  proof: ${JSON.stringify(result.proof)}`);
      console.log(`  index: ${result.index}n`);
      console.log("─".repeat(50));
      console.log(`\nLeaf hash: ${result.leaf}`);
      console.log(`Proof valid: ${result.valid}`);
    } else {
      console.log("❌ Address not found in tree");
    }
  } else {
    const tree = loadTree<VariableAmountEntry>(TREE_PATH);
    console.log(`Merkle Root: ${tree.root}\n`);

    const result = getProofByAddressVariable(tree, normalizedAddress);

    if (result) {
      console.log("✅ Address found in tree!\n");
      console.log("Claim parameters for contract:");
      console.log("─".repeat(50));
      console.log(`  proof: ${JSON.stringify(result.proof)}`);
      console.log(`  index: ${result.index}n`);
      console.log(`  amount: ${result.amount}n (${result.amount! / 10n ** 18n} tokens)`);
      console.log("─".repeat(50));
      console.log(`\nLeaf hash: ${result.leaf}`);
      console.log(`Proof valid: ${result.valid}`);
    } else {
      console.log("❌ Address not found in tree");
    }
  }
}

main().catch(console.error);
