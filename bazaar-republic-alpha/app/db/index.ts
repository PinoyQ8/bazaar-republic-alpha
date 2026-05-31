// Example: app/db/index.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// The ! ensures TypeScript knows the Vault Key is present
const sql = neon(process.env.DATABASE_URL!); // The ! forces TypeScript to trust the env file
export const db = drizzle(sql);