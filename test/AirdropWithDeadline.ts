import hre from "hardhat";
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { getAddress } from "viem";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

describe("AirdropWithDeadline", async function () {
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

  it("should allow claim before deadline", async function () {
    const currentTime = await networkHelpers.time.latest();
    const deadline = BigInt(currentTime) + 3600n; // 1 hour from now

    const asset = await viem.deployContract("Asset", [deployer.account.address]);
    const airdrop = await viem.deployContract("AirdropWithDeadline", [
      asset.address,
      root,
      claimAmount,
      deadline,
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

  it("should reject claim after deadline", async function () {
    const currentTime = await networkHelpers.time.latest();
    const deadline = BigInt(currentTime) + 3600n;

    const asset = await viem.deployContract("Asset", [deployer.account.address]);
    const airdrop = await viem.deployContract("AirdropWithDeadline", [
      asset.address,
      root,
      claimAmount,
      deadline,
    ]);
    await asset.write.mint([airdrop.address, claimAmount * BigInt(values.length)]);

    // Move time past the deadline
    await networkHelpers.time.increase(3601n);

    await assert.rejects(
      airdrop.write.claim([tree.getProof(0) as `0x${string}`[], 0n], { account: alice.account }),
      /ClaimPeriodEnded/,
    );
  });

  it("should reject deployment with past deadline", async function () {
    const currentTime = await networkHelpers.time.latest();
    const pastDeadline = BigInt(currentTime) - 1n;

    const asset = await viem.deployContract("Asset", [deployer.account.address]);

    await assert.rejects(
      viem.deployContract("AirdropWithDeadline", [
        asset.address,
        root,
        claimAmount,
        pastDeadline,
      ]),
      /InvalidDeadline/,
    );
  });

  it("should allow owner to extend deadline", async function () {
    const currentTime = await networkHelpers.time.latest();
    const deadline = BigInt(currentTime) + 3600n;
    const newDeadline = deadline + 7200n; // Extend by 2 more hours

    const asset = await viem.deployContract("Asset", [deployer.account.address]);
    const airdrop = await viem.deployContract("AirdropWithDeadline", [
      asset.address,
      root,
      claimAmount,
      deadline,
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

  it("should reject extending deadline to an earlier time", async function () {
    const currentTime = await networkHelpers.time.latest();
    const deadline = BigInt(currentTime) + 3600n;

    const asset = await viem.deployContract("Asset", [deployer.account.address]);
    const airdrop = await viem.deployContract("AirdropWithDeadline", [
      asset.address,
      root,
      claimAmount,
      deadline,
    ]);

    const earlierDeadline = deadline - 1000n;

    await assert.rejects(
      airdrop.write.extendClaimDeadline([earlierDeadline]),
      /InvalidDeadline/,
    );
  });

  it("should reject non-owner from extending deadline", async function () {
    const currentTime = await networkHelpers.time.latest();
    const deadline = BigInt(currentTime) + 3600n;
    const newDeadline = deadline + 7200n;

    const asset = await viem.deployContract("Asset", [deployer.account.address]);
    const airdrop = await viem.deployContract("AirdropWithDeadline", [
      asset.address,
      root,
      claimAmount,
      deadline,
    ]);

    await assert.rejects(
      airdrop.write.extendClaimDeadline([newDeadline], { account: alice.account }),
      /OwnableUnauthorizedAccount/,
    );
  });

  it("should allow claim after deadline extension", async function () {
    const currentTime = await networkHelpers.time.latest();
    const deadline = BigInt(currentTime) + 3600n;

    const asset = await viem.deployContract("Asset", [deployer.account.address]);
    const airdrop = await viem.deployContract("AirdropWithDeadline", [
      asset.address,
      root,
      claimAmount,
      deadline,
    ]);
    await asset.write.mint([airdrop.address, claimAmount * BigInt(values.length)]);

    // Move time past original deadline
    await networkHelpers.time.increase(3601n);

    // Extend deadline
    const latestTime = await networkHelpers.time.latest();
    const newDeadline = BigInt(latestTime) + 7200n;
    await airdrop.write.extendClaimDeadline([newDeadline]);

    // Should be able to claim now
    await viem.assertions.emitWithArgs(
      airdrop.write.claim([tree.getProof(0) as `0x${string}`[], 0n], { account: alice.account }),
      airdrop,
      "Claimed",
      [getAddress(alice.account.address), 0n, claimAmount],
    );
  });
});
