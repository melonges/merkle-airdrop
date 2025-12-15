import hre from "hardhat";
import { describe, it } from "node:test";
import assert from "node:assert";
import { getAddress } from "viem";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

describe("AirdropWithDeadlineAndMaxClaims", async function () {
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

  it("should allow claim before deadline and within max claims", async function () {
    const currentTime = await networkHelpers.time.latest();
    const deadline = BigInt(currentTime) + 3600n;
    const maxClaims = 3n;

    const asset = await viem.deployContract("Asset", [deployer.account.address]);
    const airdrop = await viem.deployContract("AirdropWithDeadlineAndMaxClaims", [
      asset.address,
      root,
      claimAmount,
      deadline,
      maxClaims,
    ]);
    await asset.write.mint([airdrop.address, claimAmount * BigInt(values.length)]);

    await viem.assertions.emitWithArgs(
      airdrop.write.claim([tree.getProof(0) as `0x${string}`[], 0n], { account: alice.account }),
      airdrop,
      "Claimed",
      [getAddress(alice.account.address), 0n, claimAmount],
    );

    const aliceBalance = await asset.read.balanceOf([alice.account.address]);
    assert.equal(aliceBalance, claimAmount);
  });

  it("should reject claim after deadline even with claims remaining", async function () {
    const currentTime = await networkHelpers.time.latest();
    const deadline = BigInt(currentTime) + 3600n;
    const maxClaims = 3n;

    const asset = await viem.deployContract("Asset", [deployer.account.address]);
    const airdrop = await viem.deployContract("AirdropWithDeadlineAndMaxClaims", [
      asset.address,
      root,
      claimAmount,
      deadline,
      maxClaims,
    ]);
    await asset.write.mint([airdrop.address, claimAmount * BigInt(values.length)]);

    // Move time past deadline
    await networkHelpers.time.increase(3601n);

    await assert.rejects(
      airdrop.write.claim([tree.getProof(0) as `0x${string}`[], 0n], { account: alice.account }),
      /ClaimPeriodEnded/,
    );
  });

  it("should reject claim when max claims reached even before deadline", async function () {
    const currentTime = await networkHelpers.time.latest();
    const deadline = BigInt(currentTime) + 3600n;
    const maxClaims = 2n; // Only 2 claims allowed

    const asset = await viem.deployContract("Asset", [deployer.account.address]);
    const airdrop = await viem.deployContract("AirdropWithDeadlineAndMaxClaims", [
      asset.address,
      root,
      claimAmount,
      deadline,
      maxClaims,
    ]);
    await asset.write.mint([airdrop.address, claimAmount * BigInt(values.length)]);

    // First two claims succeed
    await airdrop.write.claim([tree.getProof(0) as `0x${string}`[], 0n], { account: alice.account });
    await airdrop.write.claim([tree.getProof(1) as `0x${string}`[], 1n], { account: bob.account });

    // Third claim should fail
    await assert.rejects(
      airdrop.write.claim([tree.getProof(2) as `0x${string}`[], 2n], { account: carol.account }),
      /MaxClaimsReached/,
    );
  });

  it("should reject deployment with past deadline", async function () {
    const currentTime = await networkHelpers.time.latest();
    const pastDeadline = BigInt(currentTime) - 1n;
    const maxClaims = 3n;

    const asset = await viem.deployContract("Asset", [deployer.account.address]);

    await assert.rejects(
      viem.deployContract("AirdropWithDeadlineAndMaxClaims", [
        asset.address,
        root,
        claimAmount,
        pastDeadline,
        maxClaims,
      ]),
      /InvalidDeadline/,
    );
  });

  it("should reject deployment with zero max claims", async function () {
    const currentTime = await networkHelpers.time.latest();
    const deadline = BigInt(currentTime) + 3600n;

    const asset = await viem.deployContract("Asset", [deployer.account.address]);

    await assert.rejects(
      viem.deployContract("AirdropWithDeadlineAndMaxClaims", [
        asset.address,
        root,
        claimAmount,
        deadline,
        0n,
      ]),
      /InvalidClaimsRemaining/,
    );
  });

  it("should allow owner to extend deadline", async function () {
    const currentTime = await networkHelpers.time.latest();
    const deadline = BigInt(currentTime) + 3600n;
    const newDeadline = deadline + 7200n;
    const maxClaims = 3n;

    const asset = await viem.deployContract("Asset", [deployer.account.address]);
    const airdrop = await viem.deployContract("AirdropWithDeadlineAndMaxClaims", [
      asset.address,
      root,
      claimAmount,
      deadline,
      maxClaims,
    ]);

    await viem.assertions.emitWithArgs(
      airdrop.write.extendClaimDeadline([newDeadline]),
      airdrop,
      "DeadlineExtended",
      [deadline, newDeadline],
    );

    const updatedDeadline = await airdrop.read.claimDeadline();
    assert.equal(updatedDeadline, newDeadline);
  });

  it("should allow owner to set claims remaining", async function () {
    const currentTime = await networkHelpers.time.latest();
    const deadline = BigInt(currentTime) + 3600n;
    const maxClaims = 2n;
    const newMaxClaims = 5n;

    const asset = await viem.deployContract("Asset", [deployer.account.address]);
    const airdrop = await viem.deployContract("AirdropWithDeadlineAndMaxClaims", [
      asset.address,
      root,
      claimAmount,
      deadline,
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

  it("should track both deadline and claims remaining correctly", async function () {
    const currentTime = await networkHelpers.time.latest();
    const deadline = BigInt(currentTime) + 3600n;
    const maxClaims = 3n;

    const asset = await viem.deployContract("Asset", [deployer.account.address]);
    const airdrop = await viem.deployContract("AirdropWithDeadlineAndMaxClaims", [
      asset.address,
      root,
      claimAmount,
      deadline,
      maxClaims,
    ]);
    await asset.write.mint([airdrop.address, claimAmount * BigInt(values.length)]);

    // Verify initial state
    assert.equal(await airdrop.read.claimDeadline(), deadline);
    assert.equal(await airdrop.read.claimsRemaining(), maxClaims);

    // Claim and verify decrement
    await airdrop.write.claim([tree.getProof(0) as `0x${string}`[], 0n], { account: alice.account });
    assert.equal(await airdrop.read.claimsRemaining(), maxClaims - 1n);

    // Deadline should remain unchanged
    assert.equal(await airdrop.read.claimDeadline(), deadline);
  });

  it("should allow claim after deadline extension and max claims increase", async function () {
    const currentTime = await networkHelpers.time.latest();
    const deadline = BigInt(currentTime) + 3600n;
    const maxClaims = 1n;

    const asset = await viem.deployContract("Asset", [deployer.account.address]);
    const airdrop = await viem.deployContract("AirdropWithDeadlineAndMaxClaims", [
      asset.address,
      root,
      claimAmount,
      deadline,
      maxClaims,
    ]);
    await asset.write.mint([airdrop.address, claimAmount * BigInt(values.length)]);

    // First claim exhausts max claims
    await airdrop.write.claim([tree.getProof(0) as `0x${string}`[], 0n], { account: alice.account });

    // Move past deadline
    await networkHelpers.time.increase(3601n);

    // Claim should fail - MaxClaimsReached is checked first due to Solidity's C3 linearization
    await assert.rejects(
      airdrop.write.claim([tree.getProof(1) as `0x${string}`[], 1n], { account: bob.account }),
      /MaxClaimsReached/,
    );

    // Increase max claims first
    await airdrop.write.setClaimsRemaining([2n]);

    // Should still fail (deadline passed)
    await assert.rejects(
      airdrop.write.claim([tree.getProof(1) as `0x${string}`[], 1n], { account: bob.account }),
      /ClaimPeriodEnded/,
    );

    // Extend deadline
    const latestTime = await networkHelpers.time.latest();
    const newDeadline = BigInt(latestTime) + 7200n;
    await airdrop.write.extendClaimDeadline([newDeadline]);

    // Now should succeed
    await viem.assertions.emitWithArgs(
      airdrop.write.claim([tree.getProof(1) as `0x${string}`[], 1n], { account: bob.account }),
      airdrop,
      "Claimed",
      [getAddress(bob.account.address), 1n, claimAmount],
    );
  });

  it("should reject double claims", async function () {
    const currentTime = await networkHelpers.time.latest();
    const deadline = BigInt(currentTime) + 3600n;
    const maxClaims = 3n;

    const asset = await viem.deployContract("Asset", [deployer.account.address]);
    const airdrop = await viem.deployContract("AirdropWithDeadlineAndMaxClaims", [
      asset.address,
      root,
      claimAmount,
      deadline,
      maxClaims,
    ]);
    await asset.write.mint([airdrop.address, claimAmount * BigInt(values.length)]);

    // First claim succeeds
    await airdrop.write.claim([tree.getProof(0) as `0x${string}`[], 0n], { account: alice.account });

    // Second claim with same index should fail
    await assert.rejects(
      airdrop.write.claim([tree.getProof(0) as `0x${string}`[], 0n], { account: alice.account }),
      /AlreadyClaimed/,
    );
  });
});
