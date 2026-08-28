const { buildPoseidon } = require("circomlibjs");
const fs = require("fs");

async function generate() {
    const poseidon = await buildPoseidon();
    const F = poseidon.F; // Finite field for BN254

    // 1. Pioneer Private Data
    const pioneerId = 123456789;
    const kycSecret = 987654321;
    const tierLevel = 3; 
    
    // 2. Public Network Variables
    const minTier = 1;
    const epoch = 5;

    // 3. Generate Identity Commitment
    const identityCommitment = F.toObject(poseidon([pioneerId, kycSecret, tierLevel]));

    // 4. Simulate Merkle Tree (Depth 20)
    const levels = 20;
    const pathElements = [];
    const pathIndices = [];
    let currentHash = identityCommitment;

    for (let i = 0; i < levels; i++) {
        pathElements.push(0); // Dummy sibling logic
        pathIndices.push(0);  // Left child logic
        currentHash = F.toObject(poseidon([currentHash, 0]));
    }
    const root = currentHash;

    // 5. Generate Epoch Nullifier
    const nullifierHash = F.toObject(poseidon([kycSecret, epoch]));

    // 6. Output to input.json
    const input = {
        root: root.toString(),
        nullifierHash: nullifierHash.toString(),
        epoch: epoch.toString(),
        minTier: minTier.toString(),
        pioneerId: pioneerId.toString(),
        kycSecret: kycSecret.toString(),
        tierLevel: tierLevel.toString(),
        pathElements: pathElements.map(x => x.toString()),
        pathIndices: pathIndices.map(x => x.toString())
    };

    fs.writeFileSync("input.json", JSON.stringify(input, null, 2));
    console.log("SUCCESS: input.json generated with valid Poseidon constraints.");
}

generate();