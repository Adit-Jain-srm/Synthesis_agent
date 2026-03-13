// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./AgentRegistry.sol";

/**
 * @title CommitmentEngine
 * @notice Enforceable agent-to-agent agreements on-chain.
 *         Agents use their ERC-721 agentIds to propose, accept, fulfill,
 *         dispute, and resolve commitments with ETH staking.
 */
contract CommitmentEngine {
    AgentRegistry public immutable registry;

    enum Status { Proposed, Accepted, Fulfilled, Disputed, Resolved, Expired }

    struct Commitment {
        uint256 proposerAgentId;
        uint256 acceptorAgentId;
        string terms;
        uint256 stake;
        uint256 deadline;
        Status status;
        uint256 createdAt;
        string evidenceURI;
        bytes32 evidenceHash;
    }

    Commitment[] public commitments;

    event CommitmentProposed(uint256 indexed id, uint256 indexed proposerAgentId, uint256 indexed acceptorAgentId, string terms);
    event CommitmentAccepted(uint256 indexed id, uint256 indexed acceptorAgentId);
    event CommitmentFulfilled(uint256 indexed id, string evidenceURI, bytes32 evidenceHash);
    event CommitmentDisputed(uint256 indexed id, uint256 indexed disputerAgentId);
    event CommitmentResolved(uint256 indexed id, Status outcome);
    event CommitmentExpired(uint256 indexed id);

    constructor(address _registry) {
        registry = AgentRegistry(_registry);
    }

    modifier onlyAgentOwner(uint256 agentId) {
        require(registry.ownerOf(agentId) == msg.sender, "Not agent owner");
        _;
    }

    function propose(
        uint256 proposerAgentId,
        uint256 acceptorAgentId,
        string calldata terms,
        uint256 deadline
    ) external payable onlyAgentOwner(proposerAgentId) returns (uint256 commitmentId) {
        require(registry.isRegistered(proposerAgentId), "Proposer not registered");
        require(registry.isRegistered(acceptorAgentId), "Acceptor not registered");
        require(deadline > block.timestamp, "Deadline must be future");

        commitmentId = commitments.length;
        commitments.push(Commitment({
            proposerAgentId: proposerAgentId,
            acceptorAgentId: acceptorAgentId,
            terms: terms,
            stake: msg.value,
            deadline: deadline,
            status: Status.Proposed,
            createdAt: block.timestamp,
            evidenceURI: "",
            evidenceHash: bytes32(0)
        }));

        emit CommitmentProposed(commitmentId, proposerAgentId, acceptorAgentId, terms);
    }

    function accept(uint256 commitmentId) external payable {
        Commitment storage c = commitments[commitmentId];
        require(c.status == Status.Proposed, "Not in proposed state");
        require(registry.ownerOf(c.acceptorAgentId) == msg.sender, "Not acceptor owner");

        c.status = Status.Accepted;
        c.stake += msg.value;

        emit CommitmentAccepted(commitmentId, c.acceptorAgentId);
    }

    function fulfill(
        uint256 commitmentId,
        string calldata evidenceURI,
        bytes32 evidenceHash
    ) external {
        Commitment storage c = commitments[commitmentId];
        require(c.status == Status.Accepted, "Not accepted");
        require(
            registry.ownerOf(c.proposerAgentId) == msg.sender ||
            registry.ownerOf(c.acceptorAgentId) == msg.sender,
            "Not a party"
        );
        require(block.timestamp <= c.deadline, "Deadline passed");

        c.status = Status.Fulfilled;
        c.evidenceURI = evidenceURI;
        c.evidenceHash = evidenceHash;

        uint256 totalStake = c.stake;
        c.stake = 0;
        if (totalStake > 0) {
            address proposerWallet = registry.getAgentWallet(c.proposerAgentId);
            address acceptorWallet = registry.getAgentWallet(c.acceptorAgentId);
            if (proposerWallet == address(0)) proposerWallet = registry.ownerOf(c.proposerAgentId);
            if (acceptorWallet == address(0)) acceptorWallet = registry.ownerOf(c.acceptorAgentId);

            uint256 half = totalStake / 2;
            payable(proposerWallet).transfer(half);
            payable(acceptorWallet).transfer(totalStake - half);
        }

        emit CommitmentFulfilled(commitmentId, evidenceURI, evidenceHash);
    }

    function dispute(uint256 commitmentId) external {
        Commitment storage c = commitments[commitmentId];
        require(
            c.status == Status.Accepted || c.status == Status.Fulfilled,
            "Cannot dispute"
        );
        require(
            registry.ownerOf(c.proposerAgentId) == msg.sender ||
            registry.ownerOf(c.acceptorAgentId) == msg.sender,
            "Not a party"
        );

        c.status = Status.Disputed;
        uint256 disputerAgentId = registry.ownerOf(c.proposerAgentId) == msg.sender
            ? c.proposerAgentId
            : c.acceptorAgentId;
        emit CommitmentDisputed(commitmentId, disputerAgentId);
    }

    function claimExpired(uint256 commitmentId) external {
        Commitment storage c = commitments[commitmentId];
        require(
            c.status == Status.Proposed || c.status == Status.Accepted,
            "Cannot expire"
        );
        require(block.timestamp > c.deadline, "Not expired yet");

        c.status = Status.Expired;

        uint256 totalStake = c.stake;
        c.stake = 0;
        if (totalStake > 0) {
            address proposerWallet = registry.getAgentWallet(c.proposerAgentId);
            if (proposerWallet == address(0)) proposerWallet = registry.ownerOf(c.proposerAgentId);
            payable(proposerWallet).transfer(totalStake);
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
