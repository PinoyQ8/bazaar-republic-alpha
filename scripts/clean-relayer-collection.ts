import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function clean() {
  const client = new MongoClient(process.env.DATABASE_URL!);
  await client.connect();
  const db = client.db();
  
  const count = await db.collection('RelayerSyncState').countDocuments();
  console.log(`Found ${count} documents in RelayerSyncState.`);

  // Drop existing legacy documents or the index
  await db.collection('RelayerSyncState').deleteMany({});
  console.log('✅ Cleared legacy RelayerSyncState collection.');

  await client.close();
}

clean().catch(console.error);