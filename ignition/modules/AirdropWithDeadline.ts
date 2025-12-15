import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("airdropWithDeadline", (m) => {
  const asset = m.getParameter("asset");
  const merkleRoot = m.getParameter("merkleRoot");
  const claimAmount = m.getParameter("claimAmount");
  const claimDeadline = m.getParameter("claimDeadline");

  const airdrop = m.contract("AirdropWithDeadline", [
    asset,
    merkleRoot,
    claimAmount,
    claimDeadline,
  ]);

  return { airdrop };
});

