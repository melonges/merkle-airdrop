// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {BitMaps} from "@openzeppelin/contracts/utils/structs/BitMaps.sol";

contract Airdrop is Ownable {
    using BitMaps for BitMaps.BitMap;

    error AlreadyClaimed();
    error InvalidProof();
    error TransferFailed();
    error NothingToWithdraw();
    error ZeroAddress();

    event Claimed(address indexed user, uint256 index, uint256 amount);
    event UnclaimedWithdrawn(address indexed to, uint256 amount);

    IERC20 public immutable asset;
    bytes32 public merkleRoot;
    uint256 public immutable claimAmount;

    BitMaps.BitMap private _claimed;

    constructor(IERC20 asset_, bytes32 merkleRoot_, uint256 claimAmount_) Ownable(msg.sender) {
        if (address(asset_) == address(0)) revert ZeroAddress();
        asset = asset_;
        merkleRoot = merkleRoot_;
        claimAmount = claimAmount_;
    }

    function setMerkleRoot(bytes32 merkleRoot_) external onlyOwner {
        merkleRoot = merkleRoot_;
    }

    function claim(bytes32[] calldata proof, uint256 index) public virtual {
        address recipient = msg.sender;
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(index, recipient))));
        _claim(proof, leaf, index, recipient, claimAmount);
    }

    function claim(bytes32[] calldata proof, uint256 index, uint256 amount) public virtual {
        address recipient = msg.sender;
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(index, recipient, amount))));
        _claim(proof, leaf, index, recipient, amount);
    }

    function _claim(bytes32[] calldata proof, bytes32 leaf, uint256 index, address recipient, uint256 amount) internal virtual {
        if (_claimed.get(index)) revert AlreadyClaimed();

        if (!MerkleProof.verifyCalldata(proof, merkleRoot, leaf)) revert InvalidProof();

        _claimed.set(index);

        if (!asset.transfer(recipient, amount)) revert TransferFailed();

        emit Claimed(recipient, index, amount);
    }

    function isClaimed(uint256 index) external view returns (bool) {
        return _claimed.get(index);
    }

    function withdrawUnclaimed(address to) external onlyOwner {
        uint256 balance = asset.balanceOf(address(this));
        if (balance == 0) revert NothingToWithdraw();

        if (!asset.transfer(to, balance)) revert TransferFailed();

        emit UnclaimedWithdrawn(to, balance);
    }
}
