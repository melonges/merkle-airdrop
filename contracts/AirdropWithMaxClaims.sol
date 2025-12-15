// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Airdrop} from "./Airdrop.sol";

abstract contract AirdropMaxClaims is Airdrop {
    uint256 public claimsRemaining;

    error MaxClaimsReached();
    error InvalidClaimsRemaining();

    event ClaimsRemainingUpdated(uint256 previousClaimsRemaining, uint256 newClaimsRemaining);

    constructor(uint256 claimsRemaining_) {
        if (claimsRemaining_ == 0) revert InvalidClaimsRemaining();
        claimsRemaining = claimsRemaining_;
    }

    function claim(bytes32[] calldata proof, uint256 index) public virtual override {
        if (claimsRemaining == 0) revert MaxClaimsReached();

        unchecked {
            --claimsRemaining;
        }

        super.claim(proof, index);
    }

    function claim(bytes32[] calldata proof, uint256 index, uint256 amount) public virtual override {
        if (claimsRemaining == 0) revert MaxClaimsReached();

        unchecked {
            --claimsRemaining;
        }

        super.claim(proof, index, amount);
    }

    function setClaimsRemaining(uint256 newClaimsRemaining) external onlyOwner {
        uint256 previousClaimsRemaining = claimsRemaining;
        claimsRemaining = newClaimsRemaining;

        emit ClaimsRemainingUpdated(previousClaimsRemaining, newClaimsRemaining);
    }
}

contract AirdropWithMaxClaims is AirdropMaxClaims {
    constructor(IERC20 asset_, bytes32 merkleRoot_, uint256 claimAmount_, uint256 claimsRemaining_)
        Airdrop(asset_, merkleRoot_, claimAmount_)
        AirdropMaxClaims(claimsRemaining_)
    {}
}
