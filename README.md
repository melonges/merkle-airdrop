<p align="center">
  <img src="https://img.shields.io/badge/Solidity-0.8.28-363636?logo=solidity" alt="Solidity">
  <img src="https://img.shields.io/badge/Hardhat-3.x-f0d500?logo=hardhat" alt="Hardhat">
  <img src="https://img.shields.io/badge/OpenZeppelin-5.4-4E5EE4?logo=openzeppelin" alt="OpenZeppelin">
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>

<h1 align="center">🍋 Merkle Airdrop Contracts</h1>

<p align="center">
  <strong>A modular, gas-efficient, and production-ready Merkle tree-based token airdrop system</strong>
</p>

<p align="center">
  Built with OpenZeppelin contracts • Supports fixed & variable amounts • CSV import • Full TypeScript tooling
</p>

---

## ✨ Features

- **🌳 Merkle Tree Verification** — Gas-efficient claims using cryptographic proofs
- **💰 Fixed & Variable Amounts** — Support for equal distribution or custom amounts per address
- **⏰ Deadline Control** — Optional claim deadline with extension capability
- **🔢 Max Claims Limit** — Optional cap on total number of claims (FCFS)
- **📊 CSV Import** — Generate Merkle trees directly from CSV files
- **🔒 Security First** — Built on battle-tested OpenZeppelin contracts
- **📦 Export Ready** — Generate proof files ready for frontend integration
- **🧪 Fully Tested** — Comprehensive test suite included

---

## 📋 Table of Contents

- [Architecture](#-architecture)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Contracts](#-contracts)
- [Merkle Tree Generation](#-merkle-tree-generation)
- [Deployment](#-deployment)
- [Testing](#-testing)
- [Integration Guide](#-integration-guide)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Airdrop System                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐    ┌──────────────────┐                     │
│   │   Airdrop    │───▶│  AirdropDeadline │                     │
│   │    (Base)    │    │   (+ deadline)   │                     │
│   └──────────────┘    └──────────────────┘                     │
│          │                    │                                 │
│          ▼                    │                                 │
│   ┌──────────────────┐       │                                 │
│   │ AirdropMaxClaims │       │                                 │
│   │  (+ max claims)  │───────┼───────────────────┐             │
│   └──────────────────┘       │                   │             │
│                              ▼                   ▼             │
│                    ┌──────────────────────────────────┐        │
│                    │ AirdropWithDeadlineAndMaxClaims  │        │
│                    │     (all features combined)       │        │
│                    └──────────────────────────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/lemonjet-airdrop.git
cd lemonjet-airdrop

# Install dependencies
npm install
```

### Requirements

- Node.js 18+ (v20+ recommended)
- npm or yarn

> **Note:** This project uses ESM modules (`"type": "module"` in package.json)

---

## 🚀 Quick Start

### 1. Generate a Merkle Tree

```bash
# Create your airdrop list in data/airdrop-list.csv
npx hardhat run scripts/load-from-csv.ts
```

### 2. Run Tests

```bash
npx hardhat test
```

### 3. Deploy

```bash
# Update ignition/modules/parameters.json with your values
npx hardhat ignition deploy ignition/modules/Airdrop.ts --network sepolia
```

---

## 📜 Contracts

### `Airdrop.sol` — Base Contract

The foundation for all airdrop variants. Features:

- Merkle proof verification for claims
- Support for both fixed and variable amount airdrops
- BitMap for gas-efficient claim tracking
- Owner can withdraw unclaimed tokens
- Owner can update Merkle root

```solidity
// Fixed amount claim (amount set in constructor)
function claim(bytes32[] calldata proof, uint256 index) external;

// Variable amount claim (amount encoded in Merkle tree)
function claim(bytes32[] calldata proof, uint256 index, uint256 amount) external;
```

### `AirdropWithDeadline.sol`

Extends base with time-limited claiming:

```solidity
// Claims revert after deadline
function claim(bytes32[] calldata proof, uint256 index) external;

// Owner can extend (not shorten) the deadline
function extendClaimDeadline(uint64 newDeadline) external;
```

### `AirdropWithMaxClaims.sol`

Extends base with a cap on total claims (first-come-first-served):

```solidity
// Claims revert when claimsRemaining hits 0
function claim(bytes32[] calldata proof, uint256 index) external;

// Owner can adjust remaining claims
function setClaimsRemaining(uint256 newClaimsRemaining) external;
```

### `AirdropWithDeadlineAndMaxClaims.sol`

Combines both deadline and max claims restrictions. Perfect for limited-time, limited-quantity airdrops.

---

## 🌳 Merkle Tree Generation

### Option 1: From CSV File

The easiest way to generate a Merkle tree:

**Step 1:** Create your CSV file at `data/airdrop-list.csv`:

```csv
# For fixed amounts (everyone gets the same):
address
0x70997970C51812dc3A010C7d01b50e0d17dc79C8
0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

# For variable amounts (include amount column):
address,amount
0x70997970C51812dc3A010C7d01b50e0d17dc79C8,100
0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC,200
```

**Step 2:** If using variable amounts, update `scripts/load-from-csv.ts`:

```typescript
const HAS_AMOUNTS = true;  // Set to true for variable amounts
```

**Step 3:** Generate the tree:

```bash
npx hardhat run scripts/load-from-csv.ts
```

This creates three files in `./data/`:
- `airdrop-tree.json` — Full tree data (for restoration)
- `airdrop-metadata.json` — Human-readable format
- `airdrop-proofs.json` — All proofs (for frontend)

### Option 2: Programmatic Generation

Create a custom script (e.g., `scripts/my-airdrop.ts`):

```typescript
import {
  createFixedAmountEntries,
  generateFixedAmountTree,
  saveTree,
  exportProofsToFile,
} from "./merkle/index.js";

const addresses = [
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
];

// Create tree
const entries = createFixedAmountEntries(addresses);
const tree = generateFixedAmountTree(entries);

console.log("Merkle Root:", tree.root);

// Save for deployment & frontend
saveTree(tree, "./data/tree.json");
exportProofsToFile(tree, "fixed", "./data/proofs.json");
```

Then run with:

```bash
npx hardhat run scripts/my-airdrop.ts
```

### Getting Proofs

```bash
# Lookup proof for a specific address
npx hardhat run scripts/get-proof.ts
```

Or programmatically (in a script under `scripts/`):

```typescript
import { loadTree, getProofByAddress } from "./merkle/index.js";

const tree = loadTree("./data/airdrop-tree.json");
const result = getProofByAddress(tree, "0x70997970C51812dc3A010C7d01b50e0d17dc79C8");

if (result) {
  console.log({
    proof: result.proof,
    index: result.index,
    valid: result.valid,
  });
}
```

---

## 🚢 Deployment

### 1. Configure Parameters

Edit `ignition/modules/parameters.json`:

```json
{
  "$global": {
    "asset": "0xYourTokenAddress",
    "merkleRoot": "0xYourMerkleRoot",
    "claimAmount": "1000000000000000000",
    "claimDeadline": "1735689600",
    "claimsRemaining": "1000"
  }
}
```

### 2. Configure Network Credentials

Hardhat 3 uses the keystore for secure credential management:

```bash
# Set your Sepolia RPC URL
npx hardhat keystore set SEPOLIA_RPC_URL

# Set your deployer private key
npx hardhat keystore set SEPOLIA_PRIVATE_KEY

# Set Etherscan API key for verification
npx hardhat keystore set ETHERSCAN_API_KEY
```

Alternatively, you can use environment variables (less secure):

```bash
export SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_KEY"
export SEPOLIA_PRIVATE_KEY="your_private_key"
export ETHERSCAN_API_KEY="your_etherscan_key"
```

### 3. Deploy

```bash
# Choose the contract variant you need:

# Basic airdrop
npx hardhat ignition deploy ignition/modules/Airdrop.ts --network sepolia

# With deadline
npx hardhat ignition deploy ignition/modules/AirdropWithDeadline.ts --network sepolia

# With max claims
npx hardhat ignition deploy ignition/modules/AirdropWithMaxClaims.ts --network sepolia

# With both deadline and max claims
npx hardhat ignition deploy ignition/modules/AirdropWithDeadlineAndMaxClaims.ts --network sepolia
```

### 4. Fund the Contract

After deployment, transfer tokens to the airdrop contract:

```bash
# Using cast (foundry)
cast send $TOKEN_ADDRESS "transfer(address,uint256)" $AIRDROP_ADDRESS $TOTAL_AMOUNT --private-key $PRIVATE_KEY
```

### 5. Verify on Etherscan

```bash
# Basic verification
npx hardhat verify --network sepolia $AIRDROP_ADDRESS $TOKEN_ADDRESS $MERKLE_ROOT $CLAIM_AMOUNT

# Or use Ignition's built-in verification
npx hardhat ignition verify $DEPLOYMENT_ID --network sepolia
```

---

## 🧪 Testing

```bash
# Run all tests
npx hardhat test

# Run with coverage
npx hardhat test --coverage
```

### Test Suite

The project includes **24 comprehensive tests** covering:

| Contract | Tests |
|----------|-------|
| Airdrop | Basic claim functionality, proof verification |
| AirdropWithDeadline | Deadline enforcement, extension logic |
| AirdropWithMaxClaims | Claims limit, decrementing, owner controls |
| AirdropWithDeadlineAndMaxClaims | Combined feature tests, edge cases |

---

## 🔌 Integration Guide

### Frontend Integration

The `airdrop-proofs.json` file is designed for easy frontend integration:

```json
{
  "root": "0x1234...",
  "format": "fixed",
  "proofs": {
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8": {
      "index": "0",
      "proof": ["0xabc...", "0xdef..."]
    }
  }
}
```

Example React hook:

```typescript
import { useContractWrite } from 'wagmi';
import proofs from './data/airdrop-proofs.json';

function useClaim(address: string) {
  const userProof = proofs.proofs[address];

  const { write: claim } = useContractWrite({
    address: AIRDROP_ADDRESS,
    abi: AIRDROP_ABI,
    functionName: 'claim',
    args: [userProof.proof, BigInt(userProof.index)],
  });

  return { claim, eligible: !!userProof };
}
```

### Checking Eligibility

```typescript
// Check if address is in the airdrop
const isEligible = address in proofs.proofs;

// Check if already claimed (on-chain)
const isClaimed = await airdropContract.read.isClaimed([index]);
```

---

## 🔒 Security

### Audit Status

> ⚠️ **This code has not been audited.** Use at your own risk.

### Security Features

- ✅ Uses OpenZeppelin's battle-tested contracts
- ✅ BitMap for efficient double-claim prevention
- ✅ Double-hashed leaves (prevents second preimage attacks)
- ✅ Owner-only administrative functions
- ✅ Zero-address validation

### Known Considerations

1. **Token Allowance**: Ensure the contract holds enough tokens before users claim
2. **Merkle Root Updates**: Changing the root doesn't reset claim status
3. **Deadline Extension**: Can only extend, never shorten
4. **Gas Costs**: Proof verification costs ~25-35k gas depending on tree depth

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/yourusername/lemonjet-airdrop.git
cd lemonjet-airdrop

# Install dependencies
npm install

# Create a branch for your feature
git checkout -b feature/your-feature-name
```

### Code Style

- We use TypeScript for all scripts
- Solidity follows the [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Run linting before commits:

```bash
npx hardhat compile
npx hardhat test
```

### Submitting Changes

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Pull Request Guidelines

- Provide a clear description of the changes
- Include tests for new functionality
- Update documentation if needed
- Ensure all tests pass
- Keep commits atomic and well-described

### Reporting Issues

Found a bug? Please open an issue with:

- A clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Solidity/Hardhat versions

---

## 📂 Project Structure

```
lemonjet-airdrop/
├── contracts/              # Solidity contracts
│   ├── Airdrop.sol
│   ├── AirdropWithDeadline.sol
│   ├── AirdropWithMaxClaims.sol
│   ├── AirdropWithDeadlineAndMaxClaims.sol
│   └── Asset.sol           # Test ERC20 token
├── scripts/
│   ├── merkle/             # Merkle tree utilities
│   │   ├── index.ts        # Main exports
│   │   ├── generate.ts     # Tree generation
│   │   ├── load.ts         # Tree loading
│   │   ├── save.ts         # Tree persistence
│   │   ├── proof.ts        # Proof generation
│   │   └── types.ts        # TypeScript types
│   ├── generate-airdrop-tree.ts  # Example: full workflow demo
│   ├── load-from-csv.ts          # Generate tree from CSV
│   └── get-proof.ts              # Lookup proof for address
├── test/                   # Test files
├── ignition/
│   └── modules/            # Deployment modules
├── data/                   # Generated Merkle trees
└── hardhat.config.ts
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <sub>Built with 💛 by LemonJet</sub>
</p>

<p align="center">
  <a href="#-merkle-airdrop-contracts">⬆ Back to top</a>
</p>
