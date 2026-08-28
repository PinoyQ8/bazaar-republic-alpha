// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RepublicHeirSuccession
 * @notice On-Chain Dead-Man's Switch and Heir Declaration Protocol for Project Bazaar
 */
contract RepublicHeirSuccession {

    address public founder;
    uint256 public lastCheckIn;
    uint256 public inactivityThreshold = 90 days; // Time window before succession activates
    uint256 public gracePeriod = 14 days;         // Warning window after threshold is met
    
    bool public successionTriggered = false;
    bool public successionExecuted = false;

    // Declared Heirs & Multi-Sig Quorum requirements
    address[] public designatedHeirs;
    uint256 public requiredSignatures;
    mapping(address => bool) public isHeir;
    mapping(address => mapping(address => bool)) public heirApprovals; // heir => targetFounder => approved
    mapping(address => uint256) public approvalCounts;

    event FounderCheckIn(address indexed founder, uint256 timestamp);
    event InactivityAlertTriggered(uint256 timestamp);
    event SuccessionAborted(uint256 timestamp);
    event SuccessionClaimed(address indexed heir, uint256 timestamp);
    event FounderSuccessionCompleted(address indexed newFounder, uint256 timestamp);

    modifier onlyFounder() {
        require(msg.sender == founder, "Unauthorized: Caller is not the Founder");
        _;
    }

    modifier onlyHeir() {
        require(isHeir[msg.sender], "Unauthorized: Caller is not a declared heir");
        _;
    }

    constructor(address[] memory _heirs, uint256 _requiredSignatures) {
        require(_heirs.length >= _requiredSignatures, "Invalid quorum parameters");
        founder = msg.sender;
        lastCheckIn = block.timestamp;
        designatedHeirs = _heirs;
        requiredSignatures = _requiredSignatures;

        for (uint256 i = 0; i < _heirs.length; i++) {
            isHeir[_heirs[i]] = true;
        }
    }

    /**
     * @notice Periodic ping by the founder to reset the inactivity timer or abort an active trigger
     */
    function founderCheckIn() external onlyFounder {
        require(!successionExecuted, "Succession already executed");
        
        lastCheckIn = block.timestamp;
        
        // If a trigger was pulled but founder checked back in during grace period, abort succession
        if (successionTriggered) {
            successionTriggered = false;
            emit SuccessionAborted(block.timestamp);
        }

        emit FounderCheckIn(founder, block.timestamp);
    }

    /**
     * @notice Anyone can trigger the succession check if the inactivity window has elapsed
     */
    function triggerInactivitySwitch() external {
        require(!successionTriggered, "Already triggered");
        require(!successionExecuted, "Already executed");
        require(block.timestamp >= lastCheckIn + inactivityThreshold, "Inactivity threshold not yet reached");
        
        successionTriggered = true;
        emit InactivityAlertTriggered(block.timestamp);
    }

    /**
     * @notice Declared heirs co-sign to claim and transfer Founder governance privileges
     */
    function claimSuccession(address newFounderRepresentative) external onlyHeir {
        require(successionTriggered, "Succession has not been triggered");
        require(!successionExecuted, "Succession already finalized");
        require(block.timestamp >= lastCheckIn + inactivityThreshold + gracePeriod, "Grace period still active");
        require(!heirApprovals[msg.sender][newFounderRepresentative], "Already signed");

        heirApprovals[msg.sender][newFounderRepresentative] = true;
        approvalCounts[newFounderRepresentative]++;

        emit SuccessionClaimed(msg.sender, block.timestamp);

        if (approvalCounts[newFounderRepresentative] >= requiredSignatures) {
            successionExecuted = true;
            founder = newFounderRepresentative;
            emit FounderSuccessionCompleted(newFounderRepresentative, block.timestamp);
        }
    }
}