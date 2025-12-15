import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("airdrop", (m) => {
  const asset = m.getParameter("asset");
  const merkleRoot = m.getParameter("merkleRoot");
  const claimAmount = m.getParameter("claimAmount");

  const airdrop = m.contract("Airdrop", [asset, merkleRoot, claimAmount]);

  return { airdrop };
});