// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./AgentRegistry.sol";

/**
 * @title ValidationRegistry
 * @notice ERC-8004 aligned Validation Registry for AI agents.
 *         Agents request independent verification of their work,
 *         and validator contracts respond with pass/fail scores.
 *         Enables stake-secured re-execution, zkML proofs, or TEE oracles.
 */
contract ValidationRegistry {
    AgentRegistry public immutable identityRegistry;

    struct ValidationRecord {
        address validatorAddress;
        uint256 agentId;
        uint8 response;        // 0-100: 0=failed, 100=passed, intermediate for spectrum
        bytes32 responseHash;
        string tag;
        uint256 lastUpdate;
    }

    // requestHash => ValidationRecord
    mapping(bytes32 => ValidationRecord) private _records;

    // agentId => list of request hashes
    mapping(uint256 => bytes32[]) private _agentValidations;

    // validatorAddress => list of request hashes
    mapping(address => bytes32[]) private _validatorRequests;

    event ValidationRequest(
        address indexed validatorAddress,
        uint256 indexed agentId,
        string requestURI,
        bytes32 indexed requestHash
    );

    event ValidationResponse(
        address indexed validatorAddress,
        uint256 indexed agentId,
        bytes32 indexed requestHash,
        uint8 response,
        string responseURI,
        bytes32 responseHash,
        string tag
    );

    constructor(address _identityRegistry) {
        identityRegistry = AgentRegistry(_identityRegistry);
    }

    function validationRequest(
        address validatorAddress,
        uint256 agentId,
        string calldata requestURI,
        bytes32 requestHash
    ) external {
        require(identityRegistry.ownerOf(agentId) == msg.sender, "Not agent owner");
        require(validatorAddress != address(0), "Zero validator");
        require(requestHash != bytes32(0), "Zero hash");

        if (_records[requestHash].lastUpdate == 0) {
            _agentValidations[agentId].push(requestHash);
            _validatorRequests[validatorAddress].push(requestHash);
        }

        _records[requestHash] = ValidationRecord({
            validatorAddress: validatorAddress,
            agentId: agentId,
            response: 0,
            responseHash: bytes32(0),
            tag: "",
            lastUpdate: block.timestamp
        });

        emit ValidationRequest(validatorAddress, agentId, requestURI, requestHash);
    }

    function validationResponse(
        bytes32 requestHash,
        uint8 response,
        string calldata responseURI,
        bytes32 responseHash,
        string calldata tag
    ) external {
        ValidationRecord storage record = _records[requestHash];
        require(record.lastUpdate > 0, "No request found");
        require(record.validatorAddress == msg.sender, "Not the validator");
        require(response <= 100, "Response 0-100");

        record.response = response;
        record.responseHash = responseHash;
        record.tag = tag;
        record.lastUpdate = block.timestamp;

        emit ValidationResponse(
            msg.sender,
            record.agentId,
            requestHash,
            response,
            responseURI,
            responseHash,
            tag
        );
    }

    function getValidationStatus(bytes32 requestHash)
        external
        view
        returns (
            address validatorAddress,
            uint256 agentId,
            uint8 response,
            bytes32 responseHash,
            string memory tag,
            uint256 lastUpdate
        )
    {
        ValidationRecord storage r = _records[requestHash];
        return (r.validatorAddress, r.agentId, r.response, r.responseHash, r.tag, r.lastUpdate);
    }

    function getSummary(
        uint256 agentId,
        address[] calldata validatorAddresses,
        string calldata tag
    ) external view returns (uint64 count, uint8 averageResponse) {
        bytes32[] storage hashes = _agentValidations[agentId];
        bytes32 tagHash = keccak256(bytes(tag));
        bool filterTag = bytes(tag).length > 0;
        bool filterValidators = validatorAddresses.length > 0;

        uint256 total;
        uint64 matched;

        for (uint256 i = 0; i < hashes.length; i++) {
            ValidationRecord storage r = _records[hashes[i]];
            if (r.response == 0 && r.responseHash == bytes32(0)) continue;

            if (filterTag && keccak256(bytes(r.tag)) != tagHash) continue;

            if (filterValidators) {
                bool found = false;
                for (uint256 j = 0; j < validatorAddresses.length; j++) {
                    if (r.validatorAddress == validatorAddresses[j]) {
                        found = true;
                        break;
                    }
                }
                if (!found) continue;
            }

            total += r.response;
            matched++;
        }

        count = matched;
        if (matched > 0) {
            averageResponse = uint8(total / matched);
        }
    }

    function getAgentValidations(uint256 agentId) external view returns (bytes32[] memory) {
        return _agentValidations[agentId];
    }

    function getValidatorRequests(address validatorAddress) external view returns (bytes32[] memory) {
        return _validatorRequests[validatorAddress];
    }
}
