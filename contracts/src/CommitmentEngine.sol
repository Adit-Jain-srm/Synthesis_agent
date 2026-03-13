// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./AgentRegistry.sol";

/**
 * @title CommitmentEngine
 * @notice Enforceable agent-to-agent agreements on-chain.
 *         Two agents define terms (deliverable, deadline, stake),
 *         and the contract enforces outcomes transparently.
 */
contract CommitmentEngine {
    AgentRegistry public immutable registry;

    enum CommitmentStatus {
        Proposed,
        Accepted,
        Fulfilled,
        Disputed,
        Resolved,
        Expired
    }

    struct Commitment {
        address proposer;
        address acceptor;
        string terms;           // human-readable description
        uint256 stake;          // ETH staked by proposer
        uint256 deadline;
        CommitmentStatus status;
        uint256 createdAt;
        string evidenceURI;     // proof of fulfillment
    }

    Commitment[] public commitments;

    event CommitmentProposed(uint256 indexed id, address indexed proposer, address indexed acceptor, string terms);
    event CommitmentAccepted(uint256 indexed id, address indexed acceptor);
    event CommitmentFulfilled(uint256 indexed id, string evidenceURI);
    event CommitmentDisputed(uint256 indexed id, address indexed disputer);
    event CommitmentResolved(uint256 indexed id, CommitmentStatus outcome);
    event CommitmentExpired(uint256 indexed id);

    constructor(address _registry) {
        registry = AgentRegistry(_registry);
    }

    function propose(
        address acceptor,
        string calldata terms,
        uint256 deadline
    ) external payable returns (uint256 commitmentId) {
        require(registry.isRegistered(msg.sender), "Proposer not registered");
        require(registry.isRegistered(acceptor), "Acceptor not registered");
        require(deadline > block.timestamp, "Deadline must be future");

        commitmentId = commitments.length;
        commitments.push(Commitment({
            proposer: msg.sender,
            acceptor: acceptor,
            terms: terms,
            stake: msg.value,
            deadline: deadline,
            status: CommitmentStatus.Proposed,
            createdAt: block.timestamp,
            evidenceURI: ""
        }));

        emit CommitmentProposed(commitmentId, msg.sender, acceptor, terms);
    }

    function accept(uint256 commitmentId) external payable {
        Commitment storage c = commitments[commitmentId];
        require(c.status == CommitmentStatus.Proposed, "Not in proposed state");
        require(msg.sender == c.acceptor, "Not the acceptor");

        c.status = CommitmentStatus.Accepted;
        c.stake += msg.value; // acceptor can also stake

        emit CommitmentAccepted(commitmentId, msg.sender);
    }

    function fulfill(uint256 commitmentId, string calldata evidenceURI) external {
        Commitment storage c = commitments[commitmentId];
        require(c.status == CommitmentStatus.Accepted, "Not accepted");
        require(
            msg.sender == c.proposer || msg.sender == c.acceptor,
            "Not a party"
        );
        require(block.timestamp <= c.deadline, "Deadline passed");

        c.status = CommitmentStatus.Fulfilled;
        c.evidenceURI = evidenceURI;

        // Return stakes to both parties on fulfillment
        uint256 totalStake = c.stake;
        c.stake = 0;
        if (totalStake > 0) {
            uint256 half = totalStake / 2;
            payable(c.proposer).transfer(half);
            payable(c.acceptor).transfer(totalStake - half);
        }

        emit CommitmentFulfilled(commitmentId, evidenceURI);
    }

    function dispute(uint256 commitmentId) external {
        Commitment storage c = commitments[commitmentId];
        require(
            c.status == CommitmentStatus.Accepted ||
            c.status == CommitmentStatus.Fulfilled,
            "Cannot dispute"
        );
        require(
            msg.sender == c.proposer || msg.sender == c.acceptor,
            "Not a party"
        );

        c.status = CommitmentStatus.Disputed;
        emit CommitmentDisputed(commitmentId, msg.sender);
    }

    function claimExpired(uint256 commitmentId) external {
        Commitment storage c = commitments[commitmentId];
        require(
            c.status == CommitmentStatus.Proposed ||
            c.status == CommitmentStatus.Accepted,
            "Cannot expire"
        );
        require(block.timestamp > c.deadline, "Not expired yet");

        c.status = CommitmentStatus.Expired;

        // Return stake to proposer on expiry
        uint256 totalStake = c.stake;
        c.stake = 0;
        if (totalStake > 0) {
            payable(c.proposer).transfer(totalStake);
        }

        emit CommitmentExpired(commitmentId);
    }

    function getCommitment(uint256 id) external view returns (Commitment memory) {
        return commitments[id];
    }

    function getCommitmentCount() external view returns (uint256) {
        return commitments.length;
    }
}
