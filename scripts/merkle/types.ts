import type { Address } from "viem";

export type FixedAmountEntry = [bigint, Address];
export type VariableAmountEntry = [bigint, Address, bigint];

export type AirdropEntry = FixedAmountEntry | VariableAmountEntry;

export const FIXED_AMOUNT_ENCODING = ["uint256", "address"] as const;
export const VARIABLE_AMOUNT_ENCODING = ["uint256", "address", "uint256"] as const;

export interface MerkleTreeData {
  root: `0x${string}`;
  format: "fixed" | "variable";
  entries: {
    index: string;
    address: Address;
    amount?: string;
  }[];
}
