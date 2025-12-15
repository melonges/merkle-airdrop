import fs from "node:fs";
import path from "node:path";
import type { Address } from "viem";
import { getAddress, parseEther } from "viem";
import {
  createFixedAmountEntries,
  createVariableAmountEntries,
  generateFixedAmountTree,
  generateVariableAmountTree,
  saveTree,
  saveTreeWithMetadata,
  exportProofsToFile,
} from "./merkle/index.js";

const CSV_PATH = "./data/airdrop-list.csv";
const OUTPUT_DIR = "./data";
const OUTPUT_NAME = "airdrop";

const HAS_AMOUNTS = false;
const AMOUNTS_IN_ETHER = true;

function parseCSV(filePath: string): { addresses: Address[]; amounts?: bigint[] } {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.trim().split("\n");

  const dataLines = lines.slice(1).filter(line => line.trim());

  const addresses: Address[] = [];
  const amounts: bigint[] = [];

  for (const line of dataLines) {
    const parts = line.split(",").map(p => p.trim());

    if (parts[0]) {
      addresses.push(getAddress(parts[0] as Address));

      if (parts[1]) {
        const amount = AMOUNTS_IN_ETHER
          ? parseEther(parts[1])
          : BigInt(parts[1]);
        amounts.push(amount);
      }
    }
  }

  return {
    addresses,
    amounts: amounts.length > 0 ? amounts : undefined,
  };
}

async function main() {
  console.log("📄 Generate Merkle Tree from CSV\n");

  if (!fs.existsSync(CSV_PATH)) {
    console.log(`CSV file not found at ${CSV_PATH}`);
    console.log("Creating example CSV file...\n");

    const exampleContent = HAS_AMOUNTS
      ? `address,amount
0x70997970C51812dc3A010C7d01b50e0d17dc79C8,100
0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC,200
0x90F79bf6EB2c4f870365E785982E1f101E93b906,300`
      : `address
0x70997970C51812dc3A010C7d01b50e0d17dc79C8
0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
0x90F79bf6EB2c4f870365E785982E1f101E93b906`;

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    fs.writeFileSync(CSV_PATH, exampleContent);
    console.log(`Created example CSV at ${CSV_PATH}`);
    console.log("Edit this file with your addresses and run again.\n");
  }

  const { addresses, amounts } = parseCSV(CSV_PATH);
  console.log(`Loaded ${addresses.length} addresses from CSV\n`);

  if (amounts && amounts.length > 0) {
    console.log("Creating variable amount tree...\n");

    const data = addresses.map((address, i) => ({
      address,
      amount: amounts[i],
    }));

    const entries = createVariableAmountEntries(data);
    const tree = generateVariableAmountTree(entries);

    console.log(`📦 Merkle Root: ${tree.root}\n`);

    saveTree(tree, path.join(OUTPUT_DIR, `${OUTPUT_NAME}-tree.json`));
    saveTreeWithMetadata(tree, "variable", path.join(OUTPUT_DIR, `${OUTPUT_NAME}-metadata.json`));
    exportProofsToFile(tree, "variable", path.join(OUTPUT_DIR, `${OUTPUT_NAME}-proofs.json`));
  } else {
    console.log("Creating fixed amount tree...\n");

    const entries = createFixedAmountEntries(addresses);
    const tree = generateFixedAmountTree(entries);

    console.log(`📦 Merkle Root: ${tree.root}\n`);

    saveTree(tree, path.join(OUTPUT_DIR, `${OUTPUT_NAME}-tree.json`));
    saveTreeWithMetadata(tree, "fixed", path.join(OUTPUT_DIR, `${OUTPUT_NAME}-metadata.json`));
    exportProofsToFile(tree, "fixed", path.join(OUTPUT_DIR, `${OUTPUT_NAME}-proofs.json`));
  }

  console.log("\n✅ Done! Files saved to:", OUTPUT_DIR);
}

main().catch(console.error);
