// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./AgentRegistry.sol";

/**
 * @title ReputationManager
 * @notice On-chain attestation and reputation system for AI agents.
 *         Agents can attest to each other's work quality, building
 *         a verifiable, composable reputation score.
 */
contract ReputationManager {
    AgentRegistry public immutable registry;

    struct Attestation {
        address fromAgent;
        address toAgent;
        uint8 score;        // 1-5 rating
        string context;     // what was the interaction about
        uint256 timestamp;
    }

    // agent => list of attestations received
    mapping(address => Attestation[]) public attestations;

    // agent => aggregated reputation score (sum of scores)
    mapping(address => uint256) public totalScore;

    // agent => number of attestations received
    mapping(address => uint256) public attestationCount;

    // prevent duplicate attestations for same interaction
    mapping(bytes32 => bool) public attestationExists;

    event AttestationCreated(
        address indexed from,
        address indexed to,
        uint8 score,
        string context
    );

    constructor(address _registry) {
        registry = AgentRegistry(_registry);
    }

    function attest(
        address toAgent,
        uint8 score,
        string calldata context
    ) external {
        require(registry.isRegistered(msg.sender), "Attester not registered");
        require(registry.isRegistered(toAgent), "Target not registered");
        require(msg.sender != toAgent, "Cannot self-attest");
        require(score >= 1 && score <= 5, "Score must be 1-5");

        bytes32 attestId = keccak256(
            abi.encodePacked(msg.sender, toAgent, context)
        );
        require(!attestationExists[attestId], "Duplicate attestation");
        attestationExists[attestId] = true;

        attestations[toAgent].push(Attestation({
            fromAgent: msg.sender,
            toAgent: toAgent,
            score: score,
            context: context,
            timestamp: block.timestamp
        }));

        totalScore[toAgent] += score;
        attestationCount[toAgent] += 1;

        emit AttestationCreated(msg.sender, toAgent, score, context);
    }

    function getReputation(address agent) external view returns (uint256 avgScore, uint256 count) {
        count = attestationCount[agent];
        if (count == 0) return (0, 0);
        avgScore = (totalScore[agent] * 100) / count; // scaled by 100 for precision
    }

    function getAttestations(address agent) external view returns (Attestation[] memory) {
        return attestations[agent];
    }
}
