const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("⚙️ [MESH-SYNC] Initiating Pure RPC Deployment Engine...");

  // 1. Connect directly to the local node running in Terminal 1
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

  // 2. Extract the local test wallets directly from the RPC node
  const founder = await provider.getSigner(0);
  const heir1 = await provider.getSigner(1);
  const heir2 = await provider.getSigner(2);

  console.log(`[FOUNDER NODE] Deploying from wallet: ${founder.address}`);

  // Helper function to read the compiled ABIs from the artifacts folder
  const getArtifact = (contractName) => {
    const artifactPath = path.join(__dirname, `../artifacts/contracts/${contractName}.sol/${contractName}.json`);
    return JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  };

  // =========================================================================
  // 1. DEPLOY: RepublicPassportGate
  // =========================================================================
  console.log("\n[SECTOR 1] Forging RepublicPassportGate...");
  const passportArtifact = getArtifact("RepublicPassportGate");
  const PassportGateFactory = new ethers.ContractFactory(passportArtifact.abi, passportArtifact.bytecode, founder);
  
  const passportGate = await PassportGateFactory.deploy(founder.address);
  await passportGate.waitForDeployment();
  const passportGateAddress = await passportGate.getAddress();
  
  console.log(`✅ [PASSPORT-GATE] Secured at: ${passportGateAddress}`);

  // =========================================================================
  // 2. DEPLOY: RepublicHeirSuccession
  // =========================================================================
  console.log("\n[SECTOR 2] Forging RepublicHeirSuccession...");
  const heirArtifact = getArtifact("RepublicHeirSuccession");
  const HeirSuccessionFactory = new ethers.ContractFactory(heirArtifact.abi, heirArtifact.bytecode, founder);
  
  const heirs = [heir1.address, heir2.address];
  const requiredSignatures = 2; // Multi-sig requirement

  const heirSuccession = await HeirSuccessionFactory.deploy(heirs, requiredSignatures);
  await heirSuccession.waitForDeployment();
  const heirSuccessionAddress = await heirSuccession.getAddress();
  
  console.log(`✅ [HEIR-SUCCESSION] Secured at: ${heirSuccessionAddress}`);

  // =========================================================================
  // 3. FRONTEND VAULT EXPORT
  // =========================================================================
  console.log("\n=======================================================");
  console.log("🛡️ [VAULT KEYS] INJECT THESE INTO YOUR .env.local FILE:");
  console.log("=======================================================");
  console.log(`NEXT_PUBLIC_PASSPORT_GATE_ADDRESS="${passportGateAddress}"`);
  console.log(`NEXT_PUBLIC_HEIR_SUCCESSION_ADDRESS="${heirSuccessionAddress}"`);
  console.log("=======================================================\n");
}

main().catch((error) => {
  console.error("❌ [DEPLOYMENT FAULT] MESH breach detected:", error);
  process.exitCode = 1;
});