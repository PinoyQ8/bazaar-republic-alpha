import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const connectionString = process.env.DATABASE_URL!;
const sql = neon(connectionString);

// 🛡️ Ensure this line exists exactly as written:
export const db = drizzle(sql);