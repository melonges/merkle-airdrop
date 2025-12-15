import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("airdropWithMaxClaims", (m) => {
  const asset = m.getParameter("asset");
  const merkleRoot = m.getParameter("merkleRoot");
  const claimAmount = m.getParameter("claimAmount");
  const claimsRemaining = m.getParameter("claimsRemaining");

  const airdrop = m.contract("AirdropWithMaxClaims", [
    asset,
    merkleRoot,
    claimAmount,
    claimsRemaining,
  ]);

  return { airdrop };
});

