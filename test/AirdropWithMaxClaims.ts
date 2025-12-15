import hre from "hardhat";
import { describe, it } from "node:test";
import assert from "node:assert";
import { getAddress } from "viem";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

describe("AirdropWithMaxClaims", async function () {
  const { viem, networkHelpers } = await hre.network.connect();
  const [deployer, alice, bob, carol] = await viem.getWalletClients();

  const values = [
    [0n, alice.account.address],
    [1n, bob.account.address],
    [2n, carol.account.address],
  ];

  const tree = StandardMerkleTree.of(values, ["uint256", "address"]);
  const root = tree.root as `0x${string}`;
  const claimAmount = 1000n * 10n ** 18n;

  it("should allow claims when claims remaining", async function () {
    const maxClaims = 3n;

    const asset = await viem.deployContract("Asset", [deployer.account.address]);
    const airdrop = await viem.deployContract("AirdropWithMaxClaims", [
      asset.address,
      root,
      claimAmount,
      maxClaims,
    ]);
    await asset.write.mint([airdrop.address, claimAmount * BigInt(values.length)]);

    await viem.assertions.emitWithArgs(
      airdrop.write.claim([tree.getProof(0) as `0x${string}`[], 0n], { account: alice.account }),
      airdrop,
      "Claimed",
      [getAddress(alice.account.address), 0n, claimAmount],
    );

    const claimsRemaining = await airdrop.read.claimsRemaining();
    assert.equal(claimsRemaining, maxClaims - 1n);
  });

  it("should reject claim when max claims reached", async function () {
    const maxClaims = 2n; // Only allow 2 claims

    const asset = await viem.deployContract("Asset", [deployer.account.address]);
    const airdrop = await viem.deployContract("AirdropWithMaxClaims", [
      asset.address,
      root,
      claimAmount,
      maxClaims,
    ]);
    await asset.write.mint([airdrop.address, claimAmount * BigInt(values.length)]);

    // First claim
    await airdrop.write.claim([tree.getProof(0) as `0x${string}`[], 0n], { account: alice.account });

    // Second claim
    await airdrop.write.claim([tree.getProof(1) as `0x${string}`[], 1n], { account: bob.account });

    // Third claim should fail
    await assert.rejects(
      airdrop.write.claim([tree.getProof(2) as `0x${string}`[], 2n], { account: carol.account }),
      /MaxClaimsReached/,
    );
  });

  it("should reject deployment with zero max claims", async function () {
    const asset = await viem.deployContract("Asset", [deployer.account.address]);

    await assert.rejects(
      viem.deployContract("AirdropWithMaxClaims", [
        asset.address,
        root,
        claimAmount,
        0n,
      ]),
      /InvalidClaimsRemaining/,
    );
  });

  it("should allow owner to set claims remaining", async function () {
    const maxClaims = 2n;
    const newMaxClaims = 5n;

    const asset = await viem.deployContract("Asset", [deployer.account.address]);
    const airdrop = await viem.deployContract("AirdropWithMaxClaims", [
      asset.address,
      root,
      claimAmount,
      maxClaims,
    ]);

    await viem.assertions.emitWithArgs(
      airdrop.write.setClaimsRemaining([newMaxClaims]),
      airdrop,
      "ClaimsRemainingUpdated",
      [maxClaims, newMaxClaims],
    );

    const claimsRemaining = await airdrop.read.claimsRemaining();
    assert.equal(claimsRemaining, newMaxClaims);
  });

  it("should reject non-owner from setting claims remaining", async function () {
    const maxClaims = 3n;

    const asset = await viem.deployContract("Asset", [deployer.account.address]);
    const airdrop = await viem.deployContract("AirdropWithMaxClaims", [
      asset.address,
      root,
      claimAmount,
      maxClaims,
    ]);

    await assert.rejects(
      airdrop.write.setClaimsRemaining([5n], { account: alice.account }),
      /OwnableUnauthorizedAccount/,
    );
  });

  it("should allow claims after increasing max claims", async function () {
    const maxClaims = 1n;

    const asset = await viem.deployContract("Asset", [deployer.account.address]);
    const airdrop = await viem.deployContract("AirdropWithMaxClaims", [
      asset.address,
      root,
      claimAmount,
      maxClaims,
    ]);
    await asset.write.mint([airdrop.address, claimAmount * BigInt(values.length)]);

    // First claim exhausts the limit
    await airdrop.write.claim([tree.getProof(0) as `0x${string}`[], 0n], { account: alice.account });

    // Second claim should fail
    await assert.rejects(
      airdrop.write.claim([tree.getProof(1) as `0x${string}`[], 1n], { account: bob.account }),
      /MaxClaimsReached/,
    );

    // Increase max claims
    await airdrop.write.setClaimsRemaining([2n]);

    // Now bob should be able to claim
    await viem.assertions.emitWithArgs(
      airdrop.write.claim([tree.getProof(1) as `0x${string}`[], 1n], { account: bob.account }),
      airdrop,
      "Claimed",
      [getAddress(bob.account.address), 1n, claimAmount],
    );
  });

  it("should correctly decrement claims remaining", async function () {
    const maxClaims = 3n;

    const asset = await viem.deployContract("Asset", [deployer.account.address]);
    const airdrop = await viem.deployContract("AirdropWithMaxClaims", [
      asset.address,
      root,
      claimAmount,
      maxClaims,
    ]);
    await asset.write.mint([airdrop.address, claimAmount * BigInt(values.length)]);

    assert.equal(await airdrop.read.claimsRemaining(), 3n);

    await airdrop.write.claim([tree.getProof(0) as `0x${string}`[], 0n], { account: alice.account });
    assert.equal(await airdrop.read.claimsRemaining(), 2n);

    await airdrop.write.claim([tree.getProof(1) as `0x${string}`[], 1n], { account: bob.account });
    assert.equal(await airdrop.read.claimsRemaining(), 1n);

    await airdrop.write.claim([tree.getProof(2) as `0x${string}`[], 2n], { account: carol.account });
    assert.equal(await airdrop.read.claimsRemaining(), 0n);
  });
});
