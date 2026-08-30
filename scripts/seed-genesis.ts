import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// 🛡️ GENESIS NODES (VERIFIED)
const genesisNodes = [
  { pioneerId: "PinoyQ8", publicAddress: "GCUFYY4XVGYEJVLNPUCVX37QLRBWBKPCVBAVHWDM5Y7YS7I3SFVVBPEJ" },
  { pioneerId: "Mommydors", publicAddress: "GAJINIMTDB6VLV3WPYHUZHNKDQATOYKEGHCJ65HEIUJHMIN6EVFBUPYS" },
  { pioneerId: "zabrinaaaramos", publicAddress: "GAOUXH7HAQRUGFW2QE5SOA43HQGUFVRC6BB4UJP6LOE2G77YXMM6M3RS" },
  { pioneerId: "ncframos", publicAddress: "GCLPCWPCDI6F2PJV2XFNGQI5PWHF5HA6SZ3GYZGAXEZW7JQ7MZHYKZR6" },
  { pioneerId: "Melsan58", publicAddress: "GCUSN42SS263IEUYISEZLSQJOPZL4GPDFDJNM2PTPOI6ZZQVFDSKY5FZ" },
  { pioneerId: "RMCNS", publicAddress: "GBFU4ZM4UNLISIL5GEMF2MMFYPDYKWRAE2VRCRZP7CXULRYIHY7ARSJO" },
  { pioneerId: "Ahmedelreedy", publicAddress: "GATHC5YZUPRY5PJEPXLFFHAMGLBTE4FO5RWOC7ZPNTJ54UHUASILYOBD" },
];

async function seedGenesis() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  try {
    await client.connect();
    const db = client.db("bazaar_republic_alpha");

    console.log("🚀 MESH-SEED: Initiating Genesis Protocol...");

    for (const node of genesisNodes) {
      // 🛡️ MESH-GATE: Integrity Check
      if (!node.publicAddress || node.publicAddress.length < 50) {
        console.warn(`⚠️ MESH-REJECT: Skipping ${node.pioneerId} - Address format invalid.`);
        continue;
      }

      // 1. Whitelist (Fast Track)
      await db.collection("dao_whitelist").updateOne(
        { pioneerId: node.pioneerId },
        { $set: { pioneerId: node.pioneerId, whitelistedAt: new Date() } },
        { upsert: true }
      );
      
      // 2. Security Circle (Genesis Status)
      await db.collection("security_circles").updateOne(
        { publicAddress: node.publicAddress },
        { 
          $set: { 
            pioneerId: node.pioneerId,
            publicAddress: node.publicAddress,
            kyc_status: "PASSED",
            is_priority: true,
            role: "GENESIS_NODE",
            registeredAt: new Date() 
          }
        },
        { upsert: true }
      );
      console.log(`✅ Genesis Node Seeded: ${node.pioneerId}`);
    }
    console.log("🏁 MESH-SEED: DAO Genesis state achieved.");
  } catch (err) {
    console.error("❌ Seeding Fracture:", err);
  } finally {
    await client.close();
  }
}

seedGenesis();