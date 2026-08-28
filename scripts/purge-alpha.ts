import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables from your root .env.local
dotenv.config({ path: '.env.local' });

async function purgeAlphaLedger() {
  const uri = process.env.MONGODB_URI!;
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    // 🛡️ TARGET: Explicitly naming the Alpha Database
    const db = client.db("bazaar_republic_alpha");
    
    // The target collections to wipe
    const collections = ["security_circles", "pioneer_registry", "provider_ledger", "dao_whitelist", "pioneers"];
    
    console.log("🚀 MESH-PURGE: Initiating Zero State...");

    for (const col of collections) {
      try {
        await db.collection(col).drop();
        console.log(`✅ Collection '${col}' purged from Alpha.`);
      } catch (e) {
        console.log(`⚠️ Collection '${col}' was already clear.`);
      }
    }
    console.log("🏁 MESH-PURGE: Alpha Ledger reset to Genesis State.");
    
  } catch (err) {
    console.error("❌ PURGE FRACTURE:", err);
  } finally {
    await client.close();
  }
}

purgeAlphaLedger();