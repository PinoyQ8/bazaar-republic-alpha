// 🛡️ MESH OVERRIDE: Zero imports. Tapping directly into Hardhat's global memory.

async function main() {
  console.log("⚙️ [MESH-SYNC] Initiating Republic Smart Contract Deployment...");

  // 🛡️ GLOBAL EXTRACTION: Bypass Next.js compilers and grab the live CLI engine
  const hre = (globalThis as any).hre;
  const { ethers } = hre;

  // Pulling the primary signer (Founder) and two test nodes (Heirs)
  const [founder, heir1, heir2] = await ethers.getSigners();

  console.log(`[FOUNDER NODE] Deploying from wallet: ${founder.address}`);

  // =========================================================================
  // 1. DEPLOY: RepublicPassportGate
  // =========================================================================
  console.log("\n[SECTOR 1] Forging RepublicPassportGate...");
  const PassportGate = await ethers.getContractFactory("RepublicPassportGate");
  
  // Deploying with the Founder as the initial Academy Custodian
  const passportGate = await PassportGate.deploy(founder.address);
  await passportGate.waitForDeployment();
  const passportGateAddress = await passportGate.getAddress();
  
  console.log(`✅ [PASSPORT-GATE] Secured at: ${passportGateAddress}`);

  // =========================================================================
  // 2. DEPLOY: RepublicHeirSuccession
  // =========================================================================
  console.log("\n[SECTOR 2] Forging RepublicHeirSuccession...");
  const HeirSuccession = await ethers.getContractFactory("RepublicHeirSuccession");
  
  // Defining the DAO heirs and multi-sig quorum (e.g., 2 signatures required)
  const heirs = [heir1.address, heir2.address];
  const requiredSignatures = 2;

  const heirSuccession = await HeirSuccession.deploy(heirs, requiredSignatures);
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