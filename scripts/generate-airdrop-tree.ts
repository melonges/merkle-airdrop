import type { Address } from "viem";
import {
  createFixedAmountEntries,
  createVariableAmountEntries,
  generateFixedAmountTree,
  generateVariableAmountTree,
  saveTree,
  saveTreeWithMetadata,
  loadTree,
  getProofByAddress,
  getProofByAddressVariable,
  exportProofsToFile,
  type FixedAmountEntry,
  type VariableAmountEntry,
} from "./merkle/index.js";

async function main() {
  console.log("🌳 Merkle Tree Generator for Airdrop\n");

  const airdropAddresses: Address[] = [
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
  ];

  console.log("=== Fixed Amount Airdrop ===\n");

  const fixedEntries = createFixedAmountEntries(airdropAddresses);
  console.log("Created entries:");
  fixedEntries.forEach(([idx, addr]) => {
    console.log(`  ${idx}: ${addr}`);
  });

  const fixedTree = generateFixedAmountTree(fixedEntries);
  console.log(`\n📦 Merkle Root: ${fixedTree.root}`);

  saveTree(fixedTree, "./data/fixed-amount-tree.json");

  saveTreeWithMetadata(fixedTree, "fixed", "./data/fixed-amount-metadata.json");

  exportProofsToFile(fixedTree, "fixed", "./data/fixed-amount-proofs.json");

  const testAddress = airdropAddresses[0];
  const proof = getProofByAddress(fixedTree, testAddress);
  if (proof) {
    console.log(`\n🔐 Proof for ${testAddress}:`);
    console.log(`   Index: ${proof.index}`);
    console.log(`   Proof: ${JSON.stringify(proof.proof)}`);
    console.log(`   Valid: ${proof.valid}`);
  }

  console.log("\n\n=== Variable Amount Airdrop ===\n");

  const variableData = airdropAddresses.map((address, i) => ({
    address,
    amount: BigInt((i + 1) * 100) * 10n ** 18n,
  }));

  const variableEntries = createVariableAmountEntries(variableData);
  console.log("Created entries:");
  variableEntries.forEach(([idx, addr, amt]) => {
    console.log(`  ${idx}: ${addr} - ${amt / 10n ** 18n} tokens`);
  });

  const variableTree = generateVariableAmountTree(variableEntries);
  console.log(`\n📦 Merkle Root: ${variableTree.root}`);

  saveTree(variableTree, "./data/variable-amount-tree.json");
  saveTreeWithMetadata(variableTree, "variable", "./data/variable-amount-metadata.json");
  exportProofsToFile(variableTree, "variable", "./data/variable-amount-proofs.json");

  const variableProof = getProofByAddressVariable(variableTree, testAddress);
  if (variableProof) {
    console.log(`\n🔐 Proof for ${testAddress}:`);
    console.log(`   Index: ${variableProof.index}`);
    console.log(`   Amount: ${variableProof.amount! / 10n ** 18n} tokens`);
    console.log(`   Proof: ${JSON.stringify(variableProof.proof)}`);
    console.log(`   Valid: ${variableProof.valid}`);
  }

  console.log("\n\n=== Loading and Verifying ===\n");

  const loadedTree = loadTree<FixedAmountEntry>("./data/fixed-amount-tree.json");
  console.log(`Loaded tree root: ${loadedTree.root}`);
  console.log(`Roots match: ${loadedTree.root === fixedTree.root}`);

  console.log("\n✅ Done! Check the ./data folder for generated files.");
}

main().catch(console.error);
