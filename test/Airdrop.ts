import hre from "hardhat";
import { afterEach, beforeEach, describe, it } from "node:test";

import { network } from "hardhat";
import type { Address, Hex } from "viem";
import { encodePacked, getAddress, keccak256 } from "viem";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";


describe("Airdrop contracts", async function () {
  const { viem, networkHelpers } = await hre.network.connect();
  const [deployer, alice, bob, carol] = await viem.getWalletClients();
  const asset = await viem.deployContract("Asset", [deployer.account.address]);


  const values = [
    [0n, alice.account.address],
    [1n, bob.account.address],
    [2n, carol.account.address],
  ];

  const tree = StandardMerkleTree.of(values, ["uint256", "address"]);
  const root = tree.root as `0x${string}`;
  const claimAmount = 1000n * 10n ** 18n;
  const airdrop = await viem.deployContract("Airdrop", [asset.address, root, claimAmount]);
  await asset.write.mint([airdrop.address, claimAmount * BigInt(values.length)]);

  await viem.assertions.emitWithArgs(
    airdrop.write.claim([tree.getProof(0) as `0x${string}`[], 0n], { account: alice.account }),
    airdrop,
    "Claimed",
    [getAddress(alice.account.address), 0n, claimAmount],
  );
});
