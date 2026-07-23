pragma circom 2.1.6;

include "./node_modules/circomlib/circuits/poseidon.circom";
include "./node_modules/circomlib/circuits/comparators.circom";

template ENetworkKycVerifier(levels) {
    // PUBLIC SIGNALS
    signal input root;                 
    signal input nullifierHash;        
    signal input epoch;                
    signal input minTier;              

    // PRIVATE SIGNALS
    signal input pioneerId;            
    signal input kycSecret;            
    signal input tierLevel;            
    signal input pathElements[levels]; 
    signal input pathIndices[levels];  

    // 1. IDENTITY COMMITMENT GENERATION
    component identityHasher = Poseidon(3);
    identityHasher.inputs[0] <== pioneerId;
    identityHasher.inputs[1] <== kycSecret;
    identityHasher.inputs[2] <== tierLevel;

    signal identityCommitment;
    identityCommitment <== identityHasher.out;

    // 2. OPERATIONAL TIER VERIFICATION
    component gte = GreaterEqThan(8);
    gte.in[0] <== tierLevel;
    gte.in[1] <== minTier;
    gte.out === 1;

    // 3. POSEIDON MERKLE TREE MEMBERSHIP PROOF
    component hashers[levels];
    signal currentHash[levels + 1];
    currentHash[0] <== identityCommitment;

    for (var i = 0; i < levels; i++) {
        pathIndices[i] * (1 - pathIndices[i]) === 0;

        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== currentHash[i] + pathIndices[i] * (pathElements[i] - currentHash[i]);
        hashers[i].inputs[1] <== pathElements[i] + pathIndices[i] * (currentHash[i] - pathElements[i]);

        currentHash[i + 1] <== hashers[i].out;
    }

    root === currentHash[levels];

    // 4. NULLIFIER GENERATION
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== kycSecret;
    nullifierHasher.inputs[1] <== epoch;

    nullifierHash === nullifierHasher.out;
}

component main {public [root, nullifierHash, epoch, minTier]} = ENetworkKycVerifier(20);