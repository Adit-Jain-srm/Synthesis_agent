// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AgentRegistry
 * @notice On-chain identity registry for AI agents, complementing ERC-8004.
 *         Agents register with metadata and a human owner, forming the
 *         foundation of the AgentTrust protocol.
 */
contract AgentRegistry {
    struct Agent {
        address owner;         // human who controls this agent
        string name;
        string metadataURI;    // IPFS or URL to full agent profile
        uint256 registeredAt;
        bool active;
    }

    mapping(address => Agent) public agents;
    address[] public agentList;

    event AgentRegistered(address indexed agent, address indexed owner, string name);
    event AgentDeactivated(address indexed agent);
    event AgentMetadataUpdated(address indexed agent, string metadataURI);

    modifier onlyOwner(address agentAddr) {
        require(agents[agentAddr].owner == msg.sender, "Not agent owner");
        _;
    }

    modifier agentExists(address agentAddr) {
        require(agents[agentAddr].registeredAt != 0, "Agent not registered");
        _;
    }

    function registerAgent(
        address agentAddr,
        string calldata name,
        string calldata metadataURI
    ) external {
        require(agents[agentAddr].registeredAt == 0, "Already registered");

        agents[agentAddr] = Agent({
            owner: msg.sender,
            name: name,
            metadataURI: metadataURI,
            registeredAt: block.timestamp,
            active: true
        });

        agentList.push(agentAddr);
        emit AgentRegistered(agentAddr, msg.sender, name);
    }

    function updateMetadata(
        address agentAddr,
        string calldata metadataURI
    ) external onlyOwner(agentAddr) agentExists(agentAddr) {
        agents[agentAddr].metadataURI = metadataURI;
        emit AgentMetadataUpdated(agentAddr, metadataURI);
    }

    function deactivateAgent(
        address agentAddr
    ) external onlyOwner(agentAddr) agentExists(agentAddr) {
        agents[agentAddr].active = false;
        emit AgentDeactivated(agentAddr);
    }

    function isRegistered(address agentAddr) external view returns (bool) {
        return agents[agentAddr].registeredAt != 0 && agents[agentAddr].active;
    }

    function getAgentCount() external view returns (uint256) {
        return agentList.length;
    }
}
