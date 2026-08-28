const fs = require('fs');

// Helper: Convert Base-10 string from snarkjs to 32-byte Hex
function toHex32(str) {
    let hex = BigInt(str).toString(16);
    return hex.padStart(64, '0');
}

function generatePayload() {
    // Read local files
    const proof = JSON.parse(fs.readFileSync('proof.json'));
    const pubSignals = JSON.parse(fs.readFileSync('public.json'));

    // 1. Format G1 Point A (X, Y)
    const a_x = toHex32(proof.pi_a[0]);
    const a_y = toHex32(proof.pi_a[1]);
    const g1_a = a_x + a_y;

    // 2. Format G2 Point B (X1, X0, Y1, Y0)
    // SnarkJS outputs G2 coordinates in reverse order for standard Rust/EVM verifiers
    const b_x1 = toHex32(proof.pi_b[0][1]);
    const b_x0 = toHex32(proof.pi_b[0][0]);
    const b_y1 = toHex32(proof.pi_b[1][1]);
    const b_y0 = toHex32(proof.pi_b[1][0]);
    const g2_b = b_x1 + b_x0 + b_y1 + b_y0;

    // 3. Format G1 Point C (X, Y)
    const c_x = toHex32(proof.pi_c[0]);
    const c_y = toHex32(proof.pi_c[1]);
    const g1_c = c_x + c_y;

    // 4. Format Public Signals
    const pubHex = pubSignals.map(toHex32).join('');

    console.log("\n=== SOROBAN PROTOCOL v25 PAYLOAD ===");
    console.log("\n[G1 Byte Vector]: (Point A + Point C + Public Inputs)");
    console.log(`${g1_a}${g1_c}${pubHex}`);
    
    console.log("\n[G2 Byte Vector]: (Point B)");
    console.log(`${g2_b}\n`);
}

generatePayload();