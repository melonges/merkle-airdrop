import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("airdropWithDeadlineAndMaxClaims", (m) => {
  const asset = m.getParameter("asset");
  const merkleRoot = m.getParameter("merkleRoot");
  const claimAmount = m.getParameter("claimAmount");
  const claimDeadline = m.getParameter("claimDeadline");
  const claimsRemaining = m.getParameter("claimsRemaining");

  const airdrop = m.contract("AirdropWithDeadlineAndMaxClaims", [
    asset,
    merkleRoot,
    claimAmount,
    claimDeadline,
    claimsRemaining,
  ]);

  return { airdrop };
});

