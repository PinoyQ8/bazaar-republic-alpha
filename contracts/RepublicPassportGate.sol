// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RepublicPassportGate
 * @notice Academy Custodian & Mainnet Gating Protocol for Project Bazaar
 */
contract RepublicPassportGate {
    
    address public academyCustodian;
    address public founder;

    struct Passport {
        bool isIssued;
        uint256 issuedAt;
        uint256 tierLevel; // Corresponding to the 5-Tier Republic Matrix
        bool isRevoked;
    }

    mapping(address => Passport) public passports;

    event PassportIssued(address indexed pioneer, uint256 tierLevel, uint256 timestamp);
    event PassportRevoked(address indexed pioneer, uint256 timestamp);
    event CustodianUpdated(address indexed newCustodian);

    modifier onlyCustodian() {
        require(msg.sender == academyCustodian, "Unauthorized: Caller is not the Academy Custodian");
        _;
    }

    modifier onlyFounder() {
        require(msg.sender == founder, "Unauthorized: Caller is not the Founder");
        _;
    }

    constructor(address _academyCustodian) {
        founder = msg.sender;
        academyCustodian = _academyCustodian;
    }

    /**
     * @notice Updates the authorized Academy Custodian address
     */
    function setAcademyCustodian(address _newCustodian) external onlyFounder {
        academyCustodian = _newCustodian;
        emit CustodianUpdated(_newCustodian);
    }

    /**
     * @notice Issues or updates a Soulbound Republic Passport once exam parameters are satisfied
     */
    function issuePassport(address pioneer, uint256 tierLevel) external onlyCustodian {
        require(tierLevel >= 1 && tierLevel <= 5, "Invalid tier level specification");
        
        // Allows re-issuance/upgrade if previously revoked or updating existing tiers
        passports[pioneer] = Passport({
            isIssued: true,
            issuedAt: block.timestamp,
            tierLevel: tierLevel,
            isRevoked: false
        });

        emit PassportIssued(pioneer, tierLevel, block.timestamp);
    }

    /**
     * @notice Revokes a passport in the event of compliance breaches or malicious telemetry
     */
    function revokePassport(address pioneer) external onlyCustodian {
        require(passports[pioneer].isIssued && !passports[pioneer].isRevoked, "No active passport found");
        passports[pioneer].isRevoked = true;

        emit PassportRevoked(pioneer, block.timestamp);
    }

    /**
     * @notice Verifies if a given node address holds an active, unrevoked Mainnet passport
     */
    function verifyMainnetAccess(address pioneer) external view returns (bool) {
        Passport memory p = passports[pioneer];
        return p.isIssued && !p.isRevoked;
    }
}