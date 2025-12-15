// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Airdrop} from "./Airdrop.sol";
import {AirdropDeadline} from "./AirdropWithDeadline.sol";
import {AirdropMaxClaims} from "./AirdropWithMaxClaims.sol";

contract AirdropWithDeadlineAndMaxClaims is AirdropDeadline, AirdropMaxClaims {
    constructor(
        IERC20 asset_,
        bytes32 merkleRoot_,
        uint256 claimAmount_,
        uint64 claimDeadline_,
        uint256 claimsRemaining_
    )
        Airdrop(asset_, merkleRoot_, claimAmount_)
        AirdropDeadline(claimDeadline_)
        AirdropMaxClaims(claimsRemaining_)
    {}

    function claim(bytes32[] calldata proof, uint256 index)
        public
        override(AirdropDeadline, AirdropMaxClaims)
    {
        super.claim(proof, index);
    }

    function claim(bytes32[] calldata proof, uint256 index, uint256 amount)
        public
        override(AirdropDeadline, AirdropMaxClaims)
    {
        super.claim(proof, index, amount);
    }
}
