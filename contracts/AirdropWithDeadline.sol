// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Airdrop} from "./Airdrop.sol";

abstract contract AirdropDeadline is Airdrop {
    uint64 public claimDeadline;

    error ClaimPeriodEnded();
    error ClaimPeriodOpen();
    error InvalidDeadline();
    error InvalidRecipient();

    event DeadlineExtended(uint64 previousDeadline, uint64 newDeadline);

    constructor(uint64 claimDeadline_) {
        if (claimDeadline_ <= block.timestamp) revert InvalidDeadline();
        claimDeadline = claimDeadline_;
    }

    function claim(bytes32[] calldata proof, uint256 index) public virtual override {
        if (block.timestamp > claimDeadline) revert ClaimPeriodEnded();
        super.claim(proof, index);
    }

    function claim(bytes32[] calldata proof, uint256 index, uint256 amount) public virtual override {
        if (block.timestamp > claimDeadline) revert ClaimPeriodEnded();
        super.claim(proof, index, amount);
    }

    function extendClaimDeadline(uint64 newDeadline) external onlyOwner {
        uint64 previousDeadline = claimDeadline;
        if (newDeadline <= previousDeadline || newDeadline <= block.timestamp) revert InvalidDeadline();

        claimDeadline = newDeadline;

        emit DeadlineExtended(previousDeadline, newDeadline);
    }
}

contract AirdropWithDeadline is AirdropDeadline {
    constructor(IERC20 asset_, bytes32 merkleRoot_, uint256 claimAmount_, uint64 claimDeadline_)
        Airdrop(asset_, merkleRoot_, claimAmount_)
        AirdropDeadline(claimDeadline_)
    {}
}
