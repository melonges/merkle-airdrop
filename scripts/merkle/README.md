# Merkle Tree Scripts

Utilities for generating, saving, loading, and getting proofs from Merkle trees for airdrops.

## Quick Start

### 1. Generate a Merkle Tree

```bash
npx hardhat run scripts/generate-airdrop-tree.ts
```

This creates example trees in the `./data` folder.

### 2. Generate from CSV

```bash
npx hardhat run scripts/load-from-csv.ts
```

Edit `./data/airdrop-list.csv` with your addresses first.

### 3. Get Proof for an Address

```bash
npx hardhat run scripts/get-proof.ts
```

Edit the constants in the script to change the address/tree path.

## Module Usage

```typescript
import {
  // Generate
  generateFixedAmountTree,
  generateVariableAmountTree,
  createFixedAmountEntries,
  createVariableAmountEntries,

  // Save
  saveTree,
  saveTreeWithMetadata,

  // Load
  loadTree,
  loadFixedAmountTree,
  loadVariableAmountTree,

  // Proofs
  getProofByAddress,
  getProofByAddressVariable,
  exportProofsToFile,
} from "./scripts/merkle/index.js";
```

## Tree Formats

### Fixed Amount
- Leaf: `[index, address]`
- Encoding: `["uint256", "address"]`
- Use when all users claim the same amount (set in contract)

### Variable Amount
- Leaf: `[index, address, amount]`
- Encoding: `["uint256", "address", "uint256"]`
- Use when users claim different amounts

## Output Files

| File | Description |
|------|-------------|
| `*-tree.json` | OpenZeppelin dump format (for loading) |
| `*-metadata.json` | Human-readable with entries list |
| `*-proofs.json` | All proofs by address (for frontend) |

## Contract Integration

### Fixed Amount Claim
```solidity
// Airdrop.sol
function claim(bytes32[] calldata proof, uint256 index) public;
```

```typescript
const result = getProofByAddress(tree, userAddress);
await airdrop.write.claim([result.proof, result.index]);
```

### Variable Amount Claim
```solidity
// Airdrop.sol
function claim(bytes32[] calldata proof, uint256 index, uint256 amount) public;
```

```typescript
const result = getProofByAddressVariable(tree, userAddress);
await airdrop.write.claim([result.proof, result.index, result.amount]);
```
